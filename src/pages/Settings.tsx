import React, { useState, useEffect } from "react";
import { Building2, User, Key, Bell, ShieldCheck, Mail, Globe, Phone, MapPin, Sparkles } from "lucide-react";
import { api } from "../services/api";
import { useApp } from "../context/AppContext";
import Loader from "../components/Loader";

export default function Settings() {
  const { user, updateProfile, showToast } = useApp();
  const [loading, setLoading] = useState(true);

  // States
  const [companyProfile, setCompanyProfile] = useState({
    name: "",
    industry: "",
    email: "",
    phone: "",
    address: "",
    website: "",
  });

  // User Profile fields
  const [userForm, setUserForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
  });

  // Notification states
  const [notifs, setNotifs] = useState({
    dealClosed: true,
    weeklyReport: true,
    taskAssigned: true,
    smsAlerts: false,
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await api.getSettings();
        if (res.companyProfile) {
          setCompanyProfile(res.companyProfile);
        }
      } catch (e: any) {
        showToast(e.message || "Failed to load corporate configurations", "error");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [showToast]);

  // Sync state if user context updates
  useEffect(() => {
    if (user) {
      setUserForm(prev => ({
        ...prev,
        name: user.name,
        email: user.email,
      }));
    }
  }, [user]);

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await api.updateCompanyProfile(companyProfile);
      setCompanyProfile(updated);
      showToast("Company profile updated successfully", "success");
    } catch (e: any) {
      showToast(e.message || "Failed to update company settings", "error");
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(userForm);
      setUserForm(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
      }));
    } catch (_) {}
  };

  const handleNotifToggle = (key: keyof typeof notifs) => {
    setNotifs(prev => {
      const next = { ...prev, [key]: !prev[key] };
      showToast("Notification preferences updated", "success");
      return next;
    });
  };

  if (loading) {
    return <Loader fullPage />;
  }

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto" id="settings-view">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-950 tracking-tight">System & Profile Configurations</h1>
        <p className="text-sm text-slate-500 font-medium">Manage corporate company settings, security passwords, and notification channels.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Company profile and User profile forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* Company profile */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6" id="settings-company-profile">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600 shrink-0" />
              <span>Company Corporate Profile</span>
            </h3>

            <form onSubmit={handleCompanySubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Company Name</label>
                <div className="mt-1 relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={companyProfile.name}
                    onChange={e => setCompanyProfile({ ...companyProfile, name: e.target.value })}
                    className="block w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Industry Sector</label>
                <div className="mt-1 relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Sparkles className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={companyProfile.industry}
                    onChange={e => setCompanyProfile({ ...companyProfile, industry: e.target.value })}
                    className="block w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Corporate Email</label>
                <div className="mt-1 relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={companyProfile.email}
                    onChange={e => setCompanyProfile({ ...companyProfile, email: e.target.value })}
                    className="block w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Business Phone</label>
                <div className="mt-1 relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={companyProfile.phone}
                    onChange={e => setCompanyProfile({ ...companyProfile, phone: e.target.value })}
                    className="block w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700">Headquarters Address</label>
                <div className="mt-1 relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={companyProfile.address}
                    onChange={e => setCompanyProfile({ ...companyProfile, address: e.target.value })}
                    className="block w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700">Corporate Website</label>
                <div className="mt-1 relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="url"
                    required
                    value={companyProfile.website}
                    onChange={e => setCompanyProfile({ ...companyProfile, website: e.target.value })}
                    className="block w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 flex justify-end pt-2">
                <button
                  type="submit"
                  id="company-settings-submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/10 transition-colors"
                >
                  Update Company Settings
                </button>
              </div>
            </form>
          </div>

          {/* User Account and Password details */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6" id="settings-user-profile">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600 shrink-0" />
              <span>Personal Security Settings</span>
            </h3>

            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                    className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Account Access Email</label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                    className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-2">
                <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                  <Key className="h-3.5 w-3.5 text-blue-500" />
                  <span>Change Password</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Current Password</label>
                    <input
                      type="password"
                      value={userForm.currentPassword}
                      onChange={e => setUserForm({ ...userForm, currentPassword: e.target.value })}
                      className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">New Account Password</label>
                    <input
                      type="password"
                      value={userForm.newPassword}
                      onChange={e => setUserForm({ ...userForm, newPassword: e.target.value })}
                      className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      placeholder="•••••••• (Min 6 chars)"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  id="user-settings-submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/10 transition-colors"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right column: Notification settings */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6" id="settings-notifications">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600 shrink-0" />
              <span>Real-Time Notifications</span>
            </h3>

            <div className="space-y-4">
              {/* Option 1 */}
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <span className="block text-xs font-bold text-slate-900">Pipeline Deals Closed</span>
                  <p className="text-[10px] text-slate-500">Email alerts when a deal updates status to Won or Lost.</p>
                </div>
                <button
                  id="toggle-notif-dealClosed"
                  onClick={() => handleNotifToggle("dealClosed")}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                    notifs.dealClosed ? "bg-blue-600" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      notifs.dealClosed ? "translate-x-4.5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Option 2 */}
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <span className="block text-xs font-bold text-slate-900">Weekly Performance digests</span>
                  <p className="text-[10px] text-slate-500">Receive an email with corporate customer conversion indexes.</p>
                </div>
                <button
                  id="toggle-notif-weeklyReport"
                  onClick={() => handleNotifToggle("weeklyReport")}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                    notifs.weeklyReport ? "bg-blue-600" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      notifs.weeklyReport ? "translate-x-4.5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Option 3 */}
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <span className="block text-xs font-bold text-slate-900">Task Assigned</span>
                  <p className="text-[10px] text-slate-500">Get alerts when high priority tasks are scheduled.</p>
                </div>
                <button
                  id="toggle-notif-taskAssigned"
                  onClick={() => handleNotifToggle("taskAssigned")}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                    notifs.taskAssigned ? "bg-blue-600" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      notifs.taskAssigned ? "translate-x-4.5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Option 4 */}
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <span className="block text-xs font-bold text-slate-900">SMS Alerts</span>
                  <p className="text-[10px] text-slate-500">Enable cell-broadcast warnings for invoice reminders.</p>
                </div>
                <button
                  id="toggle-notif-smsAlerts"
                  onClick={() => handleNotifToggle("smsAlerts")}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                    notifs.smsAlerts ? "bg-blue-600" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      notifs.smsAlerts ? "translate-x-4.5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Secure details card */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100/60 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Identity Assured</span>
            </h4>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              This terminal connects directly with our certified enterprise server. Session credentials and user profile adjustments are securely stored using cryptographic hashing algorithms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
