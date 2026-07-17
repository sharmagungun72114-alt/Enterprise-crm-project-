import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Network, Mail, Lock, ArrowRight, ShieldAlert, Key, Chrome } from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../services/api";

export default function Login() {
  const { login, googleLogin } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [oauthInstructions, setOauthInstructions] = useState<any>(null);

  // Integrated Simulator State
  const [simulatorUsers, setSimulatorUsers] = useState<any[]>([]);
  const [customSimName, setCustomSimName] = useState("");
  const [customSimEmail, setCustomSimEmail] = useState("");
  const [modalTab, setModalTab] = useState<"simulator" | "instructions">("simulator");
  const [loadingUsers, setLoadingUsers] = useState(false);

  const loadSimulatorUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch("/api/auth/google/simulate-users");
      if (response.ok) {
        const data = await response.json();
        setSimulatorUsers(data);
      }
    } catch (err) {
      console.error("Failed to load simulator users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSimulatedSubmit = async (emailToSim: string, nameToSim?: string) => {
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/google/simulate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToSim, name: nameToSim }),
      });
      if (!response.ok) {
        throw new Error("Google SSO simulator exchange failed on server");
      }
      const data = await response.json();
      if (data.token && data.user) {
        googleLogin(data.token, data.user);
        setShowSetupModal(false);
        navigate("/");
      } else {
        setError(data.error || "Simulation failed to retrieve session credentials.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to complete Google Sign-In simulation.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const handleOauthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith(".run.app") && !origin.includes("localhost")) {
        return;
      }

      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        const { token, user } = event.data;
        if (token && user) {
          googleLogin(token, user);
          navigate("/");
        }
      } else if (event.data?.type === "OAUTH_AUTH_FAILURE") {
        setError(event.data.error || "Google authentication failed.");
      }
    };

    window.addEventListener("message", handleOauthMessage);
    return () => window.removeEventListener("message", handleOauthMessage);
  }, [googleLogin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setSubmitting(true);
    try {
      await login({ email, password });
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setSubmitting(true);
    try {
      const data = await api.getGoogleAuthUrl();
      if (data.configured && data.url) {
        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        window.open(
          data.url,
          "google_oauth",
          `width=${width},height=${height},left=${left},top=${top}`
        );
      } else {
        setOauthInstructions(data.instructions);
        await loadSimulatorUsers();
        setModalTab("simulator");
        setShowSetupModal(true);
      }
    } catch (err: any) {
      setError(err.message || "Failed to initiate Google authentication.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setError("");
    setSubmitting(true);
    try {
      await login({ email: "admin@enterprise.com", password: "password123" });
      navigate("/");
    } catch (err: any) {
      setError("Demo authentication failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8" id="login-page">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="bg-blue-600 text-white p-3.5 rounded-2xl shadow-xl shadow-blue-500/10 mb-6">
          <Network className="h-8 w-8" />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Nexus CRM
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          Sign in to manage your customer pipeline and sales intelligence
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-slate-100 shadow-xl rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 flex flex-col gap-3 text-rose-800 text-sm font-medium animate-in fade-in duration-200" id="login-error">
                <div className="flex gap-3">
                  <ShieldAlert className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
                {(error.toLowerCase().includes("password") || error.toLowerCase().includes("email") || error.toLowerCase().includes("credentials")) && (
                  <div className="text-xs text-rose-700 bg-white/60 p-3 rounded-lg border border-rose-100 space-y-1.5 mt-1 font-normal">
                    <p className="font-semibold text-rose-800">Authentication Diagnostics:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Check that your <strong>Caps Lock</strong> key is turned off.</li>
                      <li>Ensure there are no accidental <strong>spaces</strong> at the end of your email or password.</li>
                      <li>Verify the email spelling matches your registered corporate credentials.</li>
                      <li>Alternatively, utilize the <strong>Instant Demo Login</strong> below for rapid developer review.</li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-150"
                  placeholder="name@enterprise.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-150"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                id="login-submit-btn"
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-500/10 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 disabled:opacity-50"
              >
                {submitting ? "Signing in..." : "Sign In to CRM"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-xs uppercase font-bold tracking-wider">
                <span className="bg-white px-3 text-slate-400">Or continue with</span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                id="google-signin-btn"
                className="w-full flex justify-center items-center gap-2.5 py-3.5 px-4 border border-slate-200 rounded-xl shadow-xs text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150"
              >
                <Chrome className="h-5 w-5 text-red-500" />
                <span>Sign in with Google</span>
              </button>
            </div>
          </form>

          {/* Quick Demo Login */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-xs uppercase font-bold tracking-wider">
                <span className="bg-white px-3 text-slate-400">Reviewer Quick Access</span>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                id="demo-login-btn"
                onClick={handleDemoLogin}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-blue-100 rounded-xl text-sm font-semibold text-blue-700 bg-blue-50/50 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150"
              >
                <Key className="h-4 w-4 text-blue-600" />
                <span>Instant Demo Login (admin)</span>
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
             Don't have an enterprise account?{" "}
             <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500" id="link-to-register">
               Register corporate profile
             </Link>
           </p>
         </div>
       </div>

       {showSetupModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" id="oauth-setup-modal">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowSetupModal(false)}>
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-2xl border border-slate-100 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
                    <Chrome className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Google Authentication</h3>
                    <p className="text-xs text-slate-500 font-medium">Configure or simulate Nexus SSO access</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSetupModal(false)}
                  className="text-slate-400 hover:text-slate-500 transition-colors p-1.5 hover:bg-slate-50 rounded-lg"
                >
                  <span className="text-xl font-bold">&times;</span>
                </button>
              </div>

              {/* Tab headers */}
              <div className="flex border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalTab("simulator")}
                  className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-all ${
                    modalTab === "simulator"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Instant Simulator
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab("instructions")}
                  className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-all ${
                    modalTab === "instructions"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Production Setup
                </button>
              </div>

              {modalTab === "simulator" ? (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Choose an existing Nexus enterprise profile to simulate Google Sign-In instantly without any local setup:
                  </p>

                  {loadingUsers ? (
                    <div className="flex justify-center py-6">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-slate-100 p-1.5 rounded-xl bg-slate-50/50">
                      {simulatorUsers.map((u, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSimulatedSubmit(u.email, u.name)}
                          className="w-full flex items-center gap-3 p-3 bg-white hover:bg-blue-50/60 border border-slate-100 hover:border-blue-100 rounded-xl text-left transition-all duration-150 shadow-xs cursor-pointer"
                        >
                          <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{u.name}</p>
                            <p className="text-xs text-slate-500 truncate">{u.email}</p>
                          </div>
                          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">{u.role}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                      Or create a new simulated Google profile:
                    </p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (customSimEmail) {
                          handleSimulatedSubmit(customSimEmail, customSimName);
                        }
                      }}
                      className="space-y-3"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            placeholder="Jane Doe"
                            value={customSimName}
                            onChange={(e) => setCustomSimName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Google Email
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="jane@enterprise.com"
                            value={customSimEmail}
                            onChange={(e) => setCustomSimEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-all duration-150 shadow-xs cursor-pointer"
                      >
                        {submitting ? "Signing in..." : "Simulate Google Auth & Sign In"}
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-sm text-slate-600 animate-in fade-in duration-200">
                  <p>
                    To integrate real Google Sign-In with this app, please add the following credentials to your environment variables in AI Studio:
                  </p>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-mono text-xs space-y-2 text-slate-700">
                    <div>
                      <span className="text-rose-600 font-semibold">GOOGLE_CLIENT_ID</span>=your_client_id_here
                    </div>
                    <div>
                      <span className="text-rose-600 font-semibold">GOOGLE_CLIENT_SECRET</span>=your_client_secret_here
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Authorized Redirect URIs:</span>
                    <div className="space-y-1.5 font-mono text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-slate-600 break-all select-all">
                      <div>{oauthInstructions?.devCallback || "https://ais-dev-4rllibhn3srx4vby62wpyp-593226460457.asia-east1.run.app/api/auth/google/callback"}</div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 leading-relaxed bg-blue-50/50 p-3.5 rounded-xl border border-blue-50">
                    <strong>💡 How to setup:</strong> Go to the Google Cloud Console &gt; APIs &amp; Services &gt; Credentials. Create an OAuth 2.0 Client ID for Web Applications, add the Authorized Redirect URI above, and save. Then configure the keys in the AI Studio Settings panel.
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowSetupModal(false)}
                  className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all duration-150 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
     </div>
  );
}
