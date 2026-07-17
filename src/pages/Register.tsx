import React, { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Network, User, Mail, Lock, Briefcase, ArrowRight, ShieldAlert } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function Register() {
  const { register } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("Sales Representative");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const roles = [
    "Sales Representative",
    "Admin",
    "Account Manager",
    "Operations Manager",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await register({ name, email, password, role });
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8" id="register-page">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="bg-blue-600 text-white p-3.5 rounded-2xl shadow-xl shadow-blue-500/10 mb-6">
          <Network className="h-8 w-8" />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Create Corporate Profile
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          Register to establish your access to the Nexus CRM environment
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-slate-100 shadow-xl rounded-2xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 flex gap-3 text-rose-800 text-sm font-medium" id="register-error">
                <ShieldAlert className="h-5 w-5 text-rose-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Full Name
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-150"
                  placeholder="Sarah Jenkins"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Corporate Email
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-150"
                  placeholder="name@enterprise.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Corporate Role
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-5 w-5 text-slate-400" />
                </div>
                <select
                  id="role"
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-150 appearance-none"
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
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
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-150"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-150"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                id="register-submit-btn"
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-500/10 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 disabled:opacity-50"
              >
                {submitting ? "Registering account..." : "Complete Registration"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an enterprise account?{" "}
            <RouterLink to="/login" className="font-semibold text-blue-600 hover:text-blue-500" id="link-to-login">
              Sign in to session
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  );
}
