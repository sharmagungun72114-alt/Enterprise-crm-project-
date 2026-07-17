import express from "express";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createServer as createViteServer } from "vite";
import { dbInstance, User, Customer, Lead, Sale, Task } from "./server/db.ts";

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "enterprise_crm_jwt_secret_key_2026";

// File-based logging utility for debugging auth issues
function logAuthEvent(level: "INFO" | "WARN" | "ERROR", email: string, message: string) {
  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] [${level}] [${email}] ${message}\n`;
  try {
    const logPath = path.join(process.cwd(), "data", "auth_attempts.log");
    fs.appendFileSync(logPath, logMsg, "utf8");
  } catch (error: any) {
    console.error("Failed to write to auth_attempts.log:", error.message);
  }
  console.log(`[${level}] [${email}] ${message}`);
}

// Middleware to parse JSON
app.use(express.json());

// Auth Helper
function generateToken(user: User) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
}

// Auth Middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required. Please sign in." });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: "Session expired or invalid token. Please log in again." });
    }
    req.user = decoded;
    next();
  });
}

// ==================== AUTH ROUTES ====================

// Helper to sanitize inputs, removing zero-width characters and trimming
function sanitizeEmail(emailStr: string): string {
  if (!emailStr) return "";
  return emailStr
    .trim()
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, ""); // Remove hidden/zero-width spaces
}

// Register
app.post("/api/auth/register", (req, res) => {
  const { name, email, password, role } = req.body;

  const cleanName = (name || "").trim();
  const cleanEmail = sanitizeEmail(email);

  logAuthEvent("INFO", cleanEmail, `Registration attempt initiated for Name: "${cleanName}", Role: "${role || "Sales Representative"}"`);

  if (!cleanName || !cleanEmail || !password) {
    logAuthEvent("WARN", cleanEmail, "Registration rejected: Missing required fields");
    return res.status(400).json({ error: "Name, email and password are required fields. Please fill them out." });
  }

  const db = dbInstance.get();
  const existing = db.users.find((u) => sanitizeEmail(u.email) === cleanEmail);
  if (existing) {
    logAuthEvent("WARN", cleanEmail, "Registration rejected: User with this email already exists");
    return res.status(400).json({ error: "A user profile with this email address already exists. Please sign in instead." });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newUser: User = {
    id: `u-${Date.now()}`,
    name: cleanName,
    email: cleanEmail,
    passwordHash,
    role: role || "Sales Representative",
  };

  db.users.push(newUser);
  dbInstance.save();

  logAuthEvent("INFO", cleanEmail, `Registration successful. Assigned User ID: "${newUser.id}"`);

  const token = generateToken(newUser);
  res.status(201).json({
    token,
    user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
  });
});

// Login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = sanitizeEmail(email);

  logAuthEvent("INFO", cleanEmail, `Login attempt initiated. Submitted password length: ${password ? password.length : 0} chars.`);

  if (!cleanEmail || !password) {
    logAuthEvent("WARN", cleanEmail, "Login rejected: Missing email or password inputs");
    return res.status(400).json({ error: "Email and password are required. Please check your inputs." });
  }

  const db = dbInstance.get();
  const user = db.users.find((u) => sanitizeEmail(u.email) === cleanEmail);

  if (!user) {
    logAuthEvent("WARN", cleanEmail, "Authentication failed: No registered user found with this email in the database");
    return res.status(401).json({ 
      error: `No account exists with the email "${cleanEmail}". Please check your spelling, register a new corporate profile, or select 'Instant Demo Login' below.` 
    });
  }

  logAuthEvent("INFO", cleanEmail, `User found in database. User ID: "${user.id}", Role: "${user.role}". Preparing cryptographic check...`);
  
  // Database hash diagnostics
  if (user.passwordHash) {
    const parts = user.passwordHash.split("$");
    if (parts.length >= 4) {
      logAuthEvent("INFO", cleanEmail, `Stored hash diagnostics: Format=$${parts[1]}, Rounds=${parts[2]}, HashLength=${user.passwordHash.length}`);
    } else {
      logAuthEvent("WARN", cleanEmail, "Stored password hash format is non-standard or corrupted.");
    }
  } else {
    logAuthEvent("ERROR", cleanEmail, "CRITICAL: Password hash field is undefined or empty for this user account.");
  }

  // Cryptographic comparison with safe error handling
  let isMatch = false;
  let comparisonError: any = null;
  try {
    isMatch = bcrypt.compareSync(password, user.passwordHash);
    logAuthEvent("INFO", cleanEmail, `Bcrypt verification finished. Match result: ${isMatch}`);
  } catch (err: any) {
    comparisonError = err;
    logAuthEvent("ERROR", cleanEmail, `Bcrypt comparison threw an exception: ${err.message || err}`);
  }

  if (!isMatch) {
    let friendlyError = "The password you entered is incorrect. If you recently registered or updated your profile, check CAPS Lock and ensure no extra characters or accidental spaces were typed.";
    if (comparisonError) {
      friendlyError = `Server cryptographic error: ${comparisonError.message || "Unknown cryptographic issue"}. Please contact enterprise support.`;
    }
    
    logAuthEvent("WARN", cleanEmail, `Authentication failed: Password mismatch.`);
    return res.status(401).json({ error: friendlyError });
  }

  logAuthEvent("INFO", cleanEmail, `Authentication successful! Generating session JWT token...`);
  const token = generateToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// ==================== GOOGLE OAUTH ROUTES ====================

// Redirect URI resolver
function getRedirectUri() {
  const base = process.env.APP_URL || "https://ais-dev-4rllibhn3srx4vby62wpyp-593226460457.asia-east1.run.app";
  const cleanBase = base.replace(/\/+$/, "");
  return `${cleanBase}/api/auth/google/callback`;
}

// OAuth HTML popup responder
function renderOauthCallbackHtml(data: { token?: string; user?: any; error?: string }) {
  if (data.error) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Error</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #fcfcfc; padding: 40px; text-align: center; color: #1e293b; }
            .card { max-width: 480px; margin: 0 auto; background: white; padding: 32px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; }
            .icon { font-size: 48px; margin-bottom: 16px; color: #ef4444; }
            h2 { margin-top: 0; font-size: 20px; font-weight: 700; color: #0f172a; }
            p { font-size: 14px; line-height: 1.6; color: #64748b; margin-bottom: 24px; }
            .btn { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: background 0.15s; }
            .btn:hover { background-color: #2563eb; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">⚠️</div>
            <h2>Google Authentication Failed</h2>
            <p>${data.error}</p>
            <button class="btn" onclick="window.close()">Close Window</button>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_FAILURE', error: ${JSON.stringify(data.error)} }, '*');
            }
          </script>
        </body>
      </html>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Authenticating...</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #fcfcfc; padding: 40px; text-align: center; color: #1e293b; }
          .card { max-width: 480px; margin: 0 auto; background: white; padding: 32px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; }
          .spinner { border: 3px solid #f3f3f3; border-top: 3px solid #3b82f6; border-radius: 50%; width: 36px; height: 36px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          h2 { margin-top: 0; font-size: 20px; font-weight: 700; color: #0f172a; }
          p { font-size: 14px; line-height: 1.6; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="spinner"></div>
          <h2>Completing CRM Sign In</h2>
          <p>Connecting your Nexus corporate profile securely. This window will close automatically...</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'OAUTH_AUTH_SUCCESS', 
              token: ${JSON.stringify(data.token)},
              user: ${JSON.stringify(data.user)}
            }, '*');
            setTimeout(function() { window.close(); }, 800);
          } else {
            window.location.href = '/';
          }
        </script>
      </body>
    </html>
  `;
}

// Get Google Authorization URL
app.get("/api/auth/google/url", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = getRedirectUri();

  if (!clientId) {
    logAuthEvent("INFO", "google-oauth", "Google Client ID is missing. Offering developer OAuth simulation info.");
    return res.json({ 
      configured: false,
      instructions: {
        devCallback: "https://ais-dev-4rllibhn3srx4vby62wpyp-593226460457.asia-east1.run.app/api/auth/google/callback",
        prodCallback: "https://ais-pre-4rllibhn3srx4vby62wpyp-593226460457.asia-east1.run.app/api/auth/google/callback"
      }
    });
  }

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent("openid email profile")}&access_type=offline&prompt=consent`;
  res.json({ configured: true, url: googleAuthUrl });
});

// Real Google OAuth Callback handler (handles trailing slash variation too)
app.get(["/api/auth/google/callback", "/api/auth/google/callback/"], async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    logAuthEvent("WARN", "google-oauth", `Google login failed or was denied: ${error}`);
    return res.send(renderOauthCallbackHtml({ error: `Google login was denied: ${error}` }));
  }

  if (!code) {
    logAuthEvent("WARN", "google-oauth", "No authorization code received in Google callback.");
    return res.send(renderOauthCallbackHtml({ error: "No authorization code received." }));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    logAuthEvent("ERROR", "google-oauth", "Google credentials missing in callback handler.");
    return res.send(renderOauthCallbackHtml({ error: "Server credentials missing. Google Client ID or Secret are not configured." }));
  }

  const redirectUri = getRedirectUri();

  try {
    logAuthEvent("INFO", "google-oauth", "Exchanging code for credentials...");
    
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code as string,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      logAuthEvent("ERROR", "google-oauth", `Credentials exchange failed: ${errorText}`);
      return res.send(renderOauthCallbackHtml({ error: "Failed to exchange authorization code for credentials." }));
    }

    const tokenData = await tokenResponse.json() as { access_token: string };
    const accessToken = tokenData.access_token;

    logAuthEvent("INFO", "google-oauth", "Requesting profile details from Google userinfo endpoint...");
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userInfoResponse.ok) {
      logAuthEvent("ERROR", "google-oauth", "Failed to retrieve Google userinfo.");
      return res.send(renderOauthCallbackHtml({ error: "Failed to fetch user profile info from Google." }));
    }

    const googleUser = await userInfoResponse.json() as { email: string; name: string; sub: string };
    const email = sanitizeEmail(googleUser.email);
    const name = (googleUser.name || "").trim() || email.split("@")[0];

    logAuthEvent("INFO", email, `Google profile authenticated: sub=${googleUser.sub}`);

    const db = dbInstance.get();
    let user = db.users.find((u) => sanitizeEmail(u.email) === email);

    if (!user) {
      logAuthEvent("INFO", email, "User profile not found. Registering new profile via Google SSO.");
      user = {
        id: `u-google-${Date.now()}`,
        name: name,
        email: email,
        passwordHash: "", // SSO users do not have a password hash
        role: "Sales Representative",
      };
      db.users.push(user);
      dbInstance.save();
      logAuthEvent("INFO", email, `Created user profile via SSO: ID=${user.id}`);
    } else {
      logAuthEvent("INFO", email, `SSO logged in matched existing profile: ID=${user.id}, Role=${user.role}`);
    }

    const token = generateToken(user);
    logAuthEvent("INFO", email, "SSO Session JWT generated. Sign-in complete.");
    return res.send(renderOauthCallbackHtml({ token, user }));

  } catch (err: any) {
    logAuthEvent("ERROR", "google-oauth", `OAuth callback exception: ${err.message || err}`);
    return res.send(renderOauthCallbackHtml({ error: `Authentication failed: ${err.message || "Unknown error"}` }));
  }
});

// Simulator Page endpoint
app.get("/api/auth/google/simulate-page", (req, res) => {
  const db = dbInstance.get();
  const usersJson = JSON.stringify(db.users.map(u => ({ name: u.name, email: u.email, role: u.role })));

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Google Accounts - Sign In Simulator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f0f4f9; color: #1f1f1f; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .container { background: white; border-radius: 12px; border: 1px solid #dadce0; box-shadow: 0 4px 16px rgba(0,0,0,0.08); width: 100%; max-width: 450px; padding: 36px 40px; box-sizing: border-box; }
          .logo { text-align: center; margin-bottom: 16px; }
          .logo svg { height: 24px; }
          h2 { font-size: 24px; font-weight: 400; text-align: center; margin: 0 0 8px 0; color: #202124; letter-spacing: -0.2px; }
          .subtitle { font-size: 15px; text-align: center; margin: 0 0 24px 0; color: #5f6368; }
          .subtitle-bold { color: #1a73e8; font-weight: 500; }
          .account-list { list-style: none; padding: 0; margin: 0 0 24px 0; border: 1px solid #dadce0; border-radius: 8px; overflow: hidden; }
          .account-item { display: flex; align-items: center; padding: 14px 16px; border-bottom: 1px solid #dadce0; cursor: pointer; transition: background 0.15s; }
          .account-item:last-child { border-bottom: none; }
          .account-item:hover { background: #f8f9fa; }
          .avatar { width: 36px; height: 36px; border-radius: 50%; background: #1a73e8; color: white; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 600; margin-right: 12px; }
          .details { display: flex; flex-direction: column; text-align: left; }
          .name { font-size: 14px; font-weight: 600; color: #3c4043; }
          .email { font-size: 12px; color: #5f6368; margin-top: 1px; }
          .custom-user-form { margin-top: 16px; padding-top: 16px; border-top: 1px dashed #dadce0; }
          .form-title { font-size: 13px; font-weight: 600; color: #5f6368; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
          .input-group { display: flex; flex-direction: column; margin-bottom: 12px; text-align: left; }
          .input-label { font-size: 12px; font-weight: 600; color: #3c4043; margin-bottom: 4px; }
          .input-field { padding: 10px 12px; border: 1px solid #dadce0; border-radius: 6px; font-size: 14px; transition: border 0.15s; }
          .input-field:focus { border-color: #1a73e8; outline: none; }
          .btn-submit { background-color: #1a73e8; color: white; padding: 11px 16px; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; width: 100%; transition: background 0.15s; margin-top: 4px; }
          .btn-submit:hover { background-color: #1557b0; }
          .developer-badge { background: #e8f0fe; color: #1a73e8; font-size: 11px; padding: 6px 10px; border-radius: 20px; font-weight: 700; text-align: center; margin-bottom: 20px; display: inline-block; }
          .badge-container { text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <svg viewBox="0 0 74 24" width="74" height="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.24 10.285V13.4h6.887c-.275 1.564-1.88 4.593-6.887 4.593-4.32 0-7.845-3.582-7.845-8s3.525-8 7.845-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 5.48 1 0 6.48 0 13.25s5.48 12.25 12.24 12.25c7.055 0 11.75-4.964 11.75-11.95s-.07-2.265-.25-3.265H12.24z" fill="#4285F4"/>
              <path d="M30.73 14c-.815 0-1.492-.35-1.923-.974l-.063.033v.73c0 1.6-1.028 2.66-2.673 2.66-1.574 0-2.348-1.096-2.673-1.848l-2.036.84C21.895 16.63 23.36 18.5 26.07 18.5c2.943 0 4.887-1.785 4.887-5.186V8.25h-2.12v.756c-.431-.624-1.108-.974-1.923-.974-2.046 0-3.923 1.688-3.923 4.984s1.877 4.984 3.923 4.984zm-3.35-.126c-1.31 0-2.427-1.105-2.427-3.22 0-2.13 1.117-3.22 2.427-3.22 1.303 0 2.42 1.09 2.42 3.22s-1.117 3.22-2.42 3.22z" fill="#EA4335"/>
              <path d="M38.83 4v14.25h2.12V4h-2.12z" fill="#34A853"/>
              <path d="M47.88 8.167c-3.13 0-5.83 2.408-5.83 6.083s2.7 6.083 5.83 6.083c2.44 0 4.14-1.394 5.06-2.735l-2.06-1.378c-.62.91-1.44 1.705-3 1.705-1.73 0-2.83-.943-3.23-2.18l7.26-3.003-.36-.902c-.52-1.402-2.1-3.673-4.7-3.673zm0 2.378c1.08 0 1.84.557 2.14 1.254l-5.15 2.13c-.15-1.918 1.48-3.384 3.01-3.384z" fill="#FBBC05"/>
            </svg>
          </div>

          <div class="badge-container">
            <div class="developer-badge">🛡️ Google OAuth Developer Simulator</div>
          </div>
          <h2>Sign in with Google</h2>
          <p class="subtitle">to continue to <span class="subtitle-bold">Nexus CRM</span></p>

          <p style="font-size:13.5px; color:#5f6368; margin-bottom: 10px; font-weight:600; text-align: left;">Select an existing CRM profile:</p>
          <div id="account-list" class="account-list"></div>

          <div class="custom-user-form">
            <div class="form-title">Or register a new corporate profile instantly:</div>
            <form id="custom-user-form" onsubmit="handleCustomSubmit(event)">
              <div class="input-group">
                <label class="input-label">Full Name</label>
                <input id="custom-name" type="text" class="input-field" placeholder="Jane Doe" required />
              </div>
              <div class="input-group">
                <label class="input-label">Corporate Email Address</label>
                <input id="custom-email" type="email" class="input-field" placeholder="jane@enterprise.com" required />
              </div>
              <button type="submit" class="btn-submit">Simulate Google Auth & Sign In</button>
            </form>
          </div>
        </div>

        <script>
          const users = ${usersJson};
          const listContainer = document.getElementById("account-list");

          users.forEach(u => {
            const initial = u.name.charAt(0).toUpperCase();
            const item = document.createElement("div");
            item.className = "account-item";
            item.onclick = () => submitSimulatedAuth(u.email, u.name);
            item.innerHTML = \`
              <div class="avatar">\${initial}</div>
              <div class="details">
                <span class="name">\${u.name}</span>
                <span class="email">\${u.email} (\${u.role})</span>
              </div>
            \`;
            listContainer.appendChild(item);
          });

          async function submitSimulatedAuth(email, name) {
            try {
              const res = await fetch("/api/auth/google/simulate-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, name })
              });
              const data = await res.json();
              if (data.token) {
                if (window.opener) {
                  window.opener.postMessage({ 
                    type: 'OAUTH_AUTH_SUCCESS', 
                    token: data.token,
                    user: data.user
                  }, '*');
                  window.close();
                } else {
                  alert("Authentication successful (Simulator mode).");
                }
              } else {
                alert(data.error || "Simulation error");
              }
            } catch (err) {
              alert("Simulation request failed: " + err.message);
            }
          }

          function handleCustomSubmit(e) {
            e.preventDefault();
            const name = document.getElementById("custom-name").value;
            const email = document.getElementById("custom-email").value;
            submitSimulatedAuth(email, name);
          }
        </script>
      </body>
    </html>
  `);
});

// JSON API endpoint for simulated Google users
app.get("/api/auth/google/simulate-users", (req, res) => {
  const db = dbInstance.get();
  res.json(db.users.map(u => ({ name: u.name, email: u.email, role: u.role })));
});

// Create token for simulated login
app.post("/api/auth/google/simulate-token", (req, res) => {
  const { email, name } = req.body;
  const cleanEmail = sanitizeEmail(email);
  const cleanName = (name || "").trim() || cleanEmail.split("@")[0];

  logAuthEvent("INFO", cleanEmail, `SIMULATED Google SSO requested.`);

  if (!cleanEmail) {
    return res.status(400).json({ error: "Email is required" });
  }

  const db = dbInstance.get();
  let user = db.users.find((u) => sanitizeEmail(u.email) === cleanEmail);

  if (!user) {
    logAuthEvent("INFO", cleanEmail, "Simulator SSO: User not found in database. Automatically registering profile.");
    user = {
      id: `u-sim-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      passwordHash: "", // simulated OAuth login
      role: "Sales Representative",
    };
    db.users.push(user);
    dbInstance.save();
    logAuthEvent("INFO", cleanEmail, `Simulator SSO: Profile created. ID=${user.id}`);
  } else {
    logAuthEvent("INFO", cleanEmail, `Simulator SSO: Profile matched with existing ID=${user.id}`);
  }

  const token = generateToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

// Get profile
app.get("/api/auth/me", authenticateToken, (req: any, res) => {
  const db = dbInstance.get();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
});

// ==================== CUSTOMER ROUTES ====================

// Read all (with search & filter & pagination)
app.get("/api/customers", authenticateToken, (req, res) => {
  const db = dbInstance.get();
  const { search, status, page = "1", limit = "10" } = req.query;

  let result = [...db.customers];

  // Filter by status
  if (status && status !== "All") {
    result = result.filter((c) => c.status === status);
  }

  // Search by name, company, email, phone
  if (search) {
    const q = (search as string).toLowerCase();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
    );
  }

  // Sort by createdAt descending
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Pagination
  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 10;
  const total = result.length;
  const totalPages = Math.ceil(total / limitNum);
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedResult = result.slice(startIndex, startIndex + limitNum);

  res.json({
    customers: paginatedResult,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    },
  });
});

// Create customer
app.post("/api/customers", authenticateToken, (req, res) => {
  const { name, email, phone, company, status } = req.body;

  if (!name || !company) {
    return res.status(400).json({ error: "Customer name and company are required" });
  }

  const db = dbInstance.get();
  const newCustomer: Customer = {
    id: `c-${Date.now()}`,
    name,
    email: email || "",
    phone: phone || "",
    company,
    status: status === "Inactive" ? "Inactive" : "Active",
    createdAt: new Date().toISOString(),
  };

  db.customers.push(newCustomer);
  dbInstance.save();

  res.status(201).json(newCustomer);
});

// Update customer
app.put("/api/customers/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, email, phone, company, status } = req.body;

  const db = dbInstance.get();
  const index = db.customers.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Customer not found" });
  }

  db.customers[index] = {
    ...db.customers[index],
    name: name !== undefined ? name : db.customers[index].name,
    email: email !== undefined ? email : db.customers[index].email,
    phone: phone !== undefined ? phone : db.customers[index].phone,
    company: company !== undefined ? company : db.customers[index].company,
    status: status !== undefined ? status : db.customers[index].status,
  };

  dbInstance.save();
  res.json(db.customers[index]);
});

// Delete customer
app.delete("/api/customers/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = dbInstance.get();
  const index = db.customers.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Customer not found" });
  }

  db.customers.splice(index, 1);
  dbInstance.save();
  res.json({ message: "Customer deleted successfully" });
});


// ==================== LEAD ROUTES ====================

// Read all Leads
app.get("/api/leads", authenticateToken, (req, res) => {
  const db = dbInstance.get();
  const { search, status } = req.query;

  let result = [...db.leads];

  if (status && status !== "All") {
    result = result.filter((l) => l.status === status);
  }

  if (search) {
    const q = (search as string).toLowerCase();
    result = result.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.source.toLowerCase().includes(q)
    );
  }

  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(result);
});

// Create Lead
app.post("/api/leads", authenticateToken, (req, res) => {
  const { name, company, value, status, source } = req.body;

  if (!name || !company) {
    return res.status(400).json({ error: "Lead name and company are required" });
  }

  const db = dbInstance.get();
  const newLead: Lead = {
    id: `l-${Date.now()}`,
    name,
    company,
    value: parseFloat(value) || 0,
    status: status || "New",
    source: source || "Website",
    createdAt: new Date().toISOString(),
  };

  db.leads.push(newLead);
  dbInstance.save();

  res.status(201).json(newLead);
});

// Update Lead Status & Details
app.put("/api/leads/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, company, value, status, source } = req.body;

  const db = dbInstance.get();
  const index = db.leads.findIndex((l) => l.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Lead not found" });
  }

  // If status is updated to 'Won', we automatically seed a Customer if it doesn't exist
  const oldStatus = db.leads[index].status;
  
  db.leads[index] = {
    ...db.leads[index],
    name: name !== undefined ? name : db.leads[index].name,
    company: company !== undefined ? company : db.leads[index].company,
    value: value !== undefined ? parseFloat(value) : db.leads[index].value,
    status: status !== undefined ? status : db.leads[index].status,
    source: source !== undefined ? source : db.leads[index].source,
  };

  // Automatically convert won leads to customers and add a sales record!
  if (status === "Won" && oldStatus !== "Won") {
    const existingCust = db.customers.find(
      (c) => c.company.toLowerCase() === db.leads[index].company.toLowerCase()
    );
    if (!existingCust) {
      db.customers.push({
        id: `c-${Date.now()}`,
        name: db.leads[index].name,
        email: `${db.leads[index].name.toLowerCase().replace(/\s+/g, "")}@${db.leads[index].company.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
        phone: "+1 (555) 010-0000",
        company: db.leads[index].company,
        status: "Active",
        createdAt: new Date().toISOString(),
      });
    }

    db.sales.push({
      id: `s-${Date.now()}`,
      customer: db.leads[index].company,
      amount: db.leads[index].value,
      product: "Acquired Client Pipeline",
      date: new Date().toISOString(),
    });
  }

  dbInstance.save();
  res.json(db.leads[index]);
});

// Delete Lead
app.delete("/api/leads/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = dbInstance.get();
  const index = db.leads.findIndex((l) => l.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Lead not found" });
  }

  db.leads.splice(index, 1);
  dbInstance.save();
  res.json({ message: "Lead deleted successfully" });
});


// ==================== SALES ROUTES ====================

// Read all Sales
app.get("/api/sales", authenticateToken, (req, res) => {
  const db = dbInstance.get();
  const { search } = req.query;

  let result = [...db.sales];

  if (search) {
    const q = (search as string).toLowerCase();
    result = result.filter(
      (s) =>
        s.customer.toLowerCase().includes(q) ||
        s.product.toLowerCase().includes(q)
    );
  }

  result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(result);
});

// Create Sale
app.post("/api/sales", authenticateToken, (req, res) => {
  const { customer, amount, product, date } = req.body;

  if (!customer || !amount || !product) {
    return res.status(400).json({ error: "Customer, amount and product are required" });
  }

  const db = dbInstance.get();
  const newSale: Sale = {
    id: `s-${Date.now()}`,
    customer,
    amount: parseFloat(amount) || 0,
    product,
    date: date || new Date().toISOString(),
  };

  db.sales.push(newSale);
  dbInstance.save();

  res.status(201).json(newSale);
});

// Update Sale
app.put("/api/sales/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { customer, amount, product, date } = req.body;

  const db = dbInstance.get();
  const index = db.sales.findIndex((s) => s.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Sale record not found" });
  }

  db.sales[index] = {
    ...db.sales[index],
    customer: customer !== undefined ? customer : db.sales[index].customer,
    amount: amount !== undefined ? parseFloat(amount) : db.sales[index].amount,
    product: product !== undefined ? product : db.sales[index].product,
    date: date !== undefined ? date : db.sales[index].date,
  };

  dbInstance.save();
  res.json(db.sales[index]);
});

// Delete Sale
app.delete("/api/sales/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = dbInstance.get();
  const index = db.sales.findIndex((s) => s.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Sale record not found" });
  }

  db.sales.splice(index, 1);
  dbInstance.save();
  res.json({ message: "Sale record deleted successfully" });
});


// ==================== TASK ROUTES ====================

// Read all tasks
app.get("/api/tasks", authenticateToken, (req, res) => {
  const db = dbInstance.get();
  res.json(db.tasks);
});

// Create Task
app.post("/api/tasks", authenticateToken, (req, res) => {
  const { title, description, priority, dueDate, completed } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Task title is required" });
  }

  const db = dbInstance.get();
  const newTask: Task = {
    id: `t-${Date.now()}`,
    title,
    description: description || "",
    priority: priority || "Medium",
    dueDate: dueDate || new Date().toISOString().split("T")[0],
    completed: completed || false,
  };

  db.tasks.push(newTask);
  dbInstance.save();

  res.status(201).json(newTask);
});

// Update Task
app.put("/api/tasks/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, description, priority, dueDate, completed } = req.body;

  const db = dbInstance.get();
  const index = db.tasks.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  db.tasks[index] = {
    ...db.tasks[index],
    title: title !== undefined ? title : db.tasks[index].title,
    description: description !== undefined ? description : db.tasks[index].description,
    priority: priority !== undefined ? priority : db.tasks[index].priority,
    dueDate: dueDate !== undefined ? dueDate : db.tasks[index].dueDate,
    completed: completed !== undefined ? completed : db.tasks[index].completed,
  };

  dbInstance.save();
  res.json(db.tasks[index]);
});

// Delete Task
app.delete("/api/tasks/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = dbInstance.get();
  const index = db.tasks.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  db.tasks.splice(index, 1);
  dbInstance.save();
  res.json({ message: "Task deleted successfully" });
});


// ==================== REPORTS ROUTE ====================

app.get("/api/reports", authenticateToken, (req, res) => {
  const db = dbInstance.get();

  // 1. Customer Growth: cumulative/monthly additions
  const customerGrowth: { [key: string]: number } = {};
  db.customers.forEach((c) => {
    try {
      const date = new Date(c.createdAt);
      if (!isNaN(date.getTime())) {
        const monthYear = date.toLocaleString("default", { month: "short", year: "numeric" });
        customerGrowth[monthYear] = (customerGrowth[monthYear] || 0) + 1;
      }
    } catch (_) {}
  });

  // 2. Lead Conversion: Counts of leads in each stage
  const leadStages = {
    New: 0,
    Contacted: 0,
    Qualified: 0,
    Proposal: 0,
    Negotiation: 0,
    Won: 0,
    Lost: 0,
  };
  db.leads.forEach((l) => {
    if (l.status in leadStages) {
      leadStages[l.status as keyof typeof leadStages]++;
    }
  });

  // 3. Monthly Revenue Report
  const monthlyRevenue: { [key: string]: number } = {};
  db.sales.forEach((s) => {
    try {
      const date = new Date(s.date);
      if (!isNaN(date.getTime())) {
        const monthYear = date.toLocaleString("default", { month: "short", year: "numeric" });
        monthlyRevenue[monthYear] = (monthlyRevenue[monthYear] || 0) + s.amount;
      }
    } catch (_) {}
  });

  // 4. Sales Performance by Product
  const productPerformance: { [key: string]: number } = {};
  db.sales.forEach((s) => {
    productPerformance[s.product] = (productPerformance[s.product] || 0) + s.amount;
  });

  res.json({
    customerGrowth: Object.entries(customerGrowth).map(([month, count]) => ({ month, count })),
    leadConversion: Object.entries(leadStages).map(([stage, count]) => ({ stage, count })),
    monthlyRevenue: Object.entries(monthlyRevenue).map(([month, amount]) => ({ month, amount })),
    salesPerformance: Object.entries(productPerformance).map(([product, amount]) => ({ product, amount })),
  });
});


// ==================== SETTINGS ROUTES ====================

// Get all settings
app.get("/api/settings", authenticateToken, (req, res) => {
  const db = dbInstance.get();
  res.json({
    companyProfile: db.companyProfile,
  });
});

// Update company profile
app.put("/api/settings", authenticateToken, (req, res) => {
  const { name, industry, email, phone, address, website } = req.body;
  const db = dbInstance.get();

  db.companyProfile = {
    name: name || db.companyProfile.name,
    industry: industry || db.companyProfile.industry,
    email: email || db.companyProfile.email,
    phone: phone || db.companyProfile.phone,
    address: address || db.companyProfile.address,
    website: website || db.companyProfile.website,
  };

  dbInstance.save();
  res.json(db.companyProfile);
});

// Update logged in user profile (password & name)
app.put("/api/settings/profile", authenticateToken, (req: any, res) => {
  const { name, email, currentPassword, newPassword } = req.body;
  const db = dbInstance.get();

  const userIndex = db.users.findIndex((u) => u.id === req.user.id);
  if (userIndex === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  const user = db.users[userIndex];

  // Validate current password if attempting to change password
  if (newPassword) {
    const timestamp = new Date().toISOString();
    console.log(`[AUTH LOGGER] [${timestamp}] Profile update: Password change requested for user ID "${user.id}" (${user.email})`);

    if (!currentPassword) {
      console.warn(`[AUTH LOGGER] [${timestamp}] Profile update rejected: Missing current password`);
      return res.status(400).json({ error: "Current password is required to change to a new password." });
    }

    let isMatch = false;
    let comparisonError: any = null;
    try {
      isMatch = bcrypt.compareSync(currentPassword, user.passwordHash);
      console.log(`[AUTH LOGGER] [${timestamp}] Current password verification complete. Result: Match=${isMatch}`);
    } catch (err: any) {
      comparisonError = err;
      console.error(`[AUTH LOGGER] [${timestamp}] EXCEPTION: Current password verification failed during execution:`, err.message || err);
    }

    if (!isMatch) {
      let friendlyError = "The current password you provided is incorrect. Please try again.";
      if (comparisonError) {
        friendlyError = `Server cryptographic error verifying password: ${comparisonError.message || "Unknown cryptographic issue"}. Please contact support.`;
      }
      
      console.warn(`[AUTH LOGGER] [${timestamp}] Profile update failed: Current password mismatch.`);
      return res.status(400).json({ error: friendlyError });
    }

    const salt = bcrypt.genSaltSync(10);
    user.passwordHash = bcrypt.hashSync(newPassword, salt);
    console.log(`[AUTH LOGGER] [${timestamp}] Profile update: Password updated successfully with new bcrypt salt.`);
  }

  if (name) user.name = name.trim();
  if (email) {
    const cleanEmail = sanitizeEmail(email);
    const existing = db.users.find((u) => sanitizeEmail(u.email) === cleanEmail && u.id !== user.id);
    if (existing) {
      return res.status(400).json({ error: "Email already taken by another user" });
    }
    user.email = cleanEmail;
  }

  dbInstance.save();
  res.json({
    message: "Profile updated successfully",
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});


// ==================== DEVELOPMENT & PRODUCTION FLOW ====================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
