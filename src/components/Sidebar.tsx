import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  DollarSign,
  CheckSquare,
  BarChart3,
  Settings,
  Network,
  LogOut,
} from "lucide-react";
import { useApp } from "../context/AppContext";

export default function Sidebar() {
  const { logout, user } = useApp();

  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Customers", path: "/customers", icon: Users },
    { name: "Leads", path: "/leads", icon: TrendingUp },
    { name: "Sales Pipeline", path: "/sales", icon: DollarSign },
    { name: "Tasks Manager", path: "/tasks", icon: CheckSquare },
    { name: "Analytics & Reports", path: "/reports", icon: BarChart3 },
    { name: "System Settings", path: "/settings", icon: Settings },
  ];

  return (
    <aside
      id="crm-sidebar"
      className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 h-screen sticky top-0 border-r border-slate-800"
    >
      {/* Brand Section */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-blue-600 text-white p-2 rounded-xl">
          <Network className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-bold text-white tracking-wide text-lg">Nexus CRM</h1>
          <span className="text-xs text-blue-400 font-medium tracking-wider uppercase">Enterprise Pipeline</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            id={`nav-link-${item.path.replace("/", "") || "dashboard"}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/30 font-semibold"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
            {user?.name ? user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "U"}
          </div>
          <div className="truncate flex-1">
            <h4 className="text-sm font-semibold text-white truncate">{user?.name || "Corporate User"}</h4>
            <p className="text-xs text-slate-500 truncate">{user?.role || "Staff"}</p>
          </div>
        </div>
        <button
          id="sidebar-logout-btn"
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 rounded-xl transition-all duration-150 border border-transparent hover:border-rose-900/40"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out Session</span>
        </button>
      </div>
    </aside>
  );
}
