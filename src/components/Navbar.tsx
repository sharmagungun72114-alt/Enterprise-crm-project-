import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, LogOut, Network, User as UserIcon } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function Navbar() {
  const { user, logout } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", path: "/" },
    { name: "Customers", path: "/customers" },
    { name: "Leads", path: "/leads" },
    { name: "Sales", path: "/sales" },
    { name: "Tasks", path: "/tasks" },
    { name: "Reports", path: "/reports" },
    { name: "Settings", path: "/settings" },
  ];

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="bg-white border-b border-slate-100 h-16 sticky top-0 z-40 w-full" id="crm-navbar">
      <div className="mx-auto px-4 h-full flex items-center justify-between">
        {/* Mobile Header Brand & Toggle */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            id="mobile-nav-toggle"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg focus:outline-none"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <Link to="/" className="flex items-center gap-2 font-bold text-slate-900 text-lg">
            <Network className="h-5 w-5 text-blue-600" />
            <span>Nexus CRM</span>
          </Link>
        </div>

        {/* Desktop Welcome Status */}
        <div className="hidden md:flex flex-col">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{today}</span>
          <h2 className="text-sm font-semibold text-slate-700">
            Welcome, <span className="text-blue-600 font-bold">{user?.name || "Corporate Associate"}</span>
          </h2>
        </div>

        {/* Profile Controls & Notifications */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="block text-xs font-bold text-slate-800">{user?.name}</span>
            <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {user?.role || "Corporate Associate"}
            </span>
          </div>

          <Link
            to="/settings"
            className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center hover:bg-slate-100 text-slate-600 transition-all duration-150"
            title="Profile & Settings"
            id="navbar-profile-btn"
          >
            <UserIcon className="h-5 w-5" />
          </Link>

          <button
            id="navbar-logout-btn"
            onClick={logout}
            className="h-10 w-10 md:hidden rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 hover:bg-rose-100 transition-all duration-150"
            title="Sign Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Sidebar Drawer overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex" id="mobile-nav-drawer">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsOpen(false)}></div>

          {/* Drawer Menu */}
          <div className="relative flex flex-col w-80 max-w-[80%] bg-slate-900 text-slate-300 h-full p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-5">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white p-2 rounded-xl">
                  <Network className="h-5 w-5" />
                </div>
                <h1 className="font-bold text-white text-lg">Nexus CRM</h1>
              </div>
              <button
                id="mobile-nav-close"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`
                  }
                >
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </nav>

            <div className="border-t border-slate-800 pt-5 mt-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                  {user?.name ? user.name[0].toUpperCase() : "U"}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white leading-none">{user?.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{user?.role}</p>
                </div>
              </div>
              <button
                id="mobile-logout-btn"
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-rose-400 bg-rose-950/20 hover:bg-rose-950/40 rounded-xl transition-all duration-150 border border-rose-900/30"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
