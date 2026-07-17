import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import ToastContainer from "./components/ToastContainer";
import Loader from "./components/Loader";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Leads from "./pages/Leads";
import Sales from "./pages/Sales";
import Tasks from "./pages/Tasks";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useApp();

  if (isLoading) {
    return <Loader fullPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-900 overflow-hidden" id="app-layout">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main viewport */}
      <div className="flex flex-col flex-1 overflow-hidden h-full">
        {/* Top header navigation */}
        <Navbar />

        {/* Content container */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <ToastContainer />
        <Routes>
          {/* Public Authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Secure Private System Console */}
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Fallback Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

