import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  TrendingUp,
  DollarSign,
  CheckSquare,
  PlusCircle,
  FileText,
  Activity,
  Plus,
  X,
  Briefcase,
  AlertCircle,
  TrendingDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { api } from "../services/api";
import { useApp } from "../context/AppContext";
import Loader from "../components/Loader";

export default function Dashboard() {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(true);

  // Core Data
  const [customers, setCustomers] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  // Modals Visibility
  const [customerModal, setCustomerModal] = useState(false);
  const [leadModal, setLeadModal] = useState(false);
  const [taskModal, setTaskModal] = useState(false);
  const [saleModal, setSaleModal] = useState(false);

  // Modal Form States
  const [customerForm, setCustomerForm] = useState({ name: "", email: "", phone: "", company: "", status: "Active" });
  const [leadForm, setLeadForm] = useState({ name: "", company: "", value: "", status: "New", source: "Website" });
  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "Medium", dueDate: "" });
  const [saleForm, setSaleForm] = useState({ customer: "", amount: "", product: "", date: "" });

  const fetchData = async () => {
    try {
      const customersRes = await api.getCustomers({ limit: 100 });
      const leadsRes = await api.getLeads();
      const salesRes = await api.getSales();
      const tasksRes = await api.getTasks();

      setCustomers(customersRes.customers || []);
      setLeads(leadsRes || []);
      setSales(salesRes || []);
      setTasks(tasksRes || []);
    } catch (e: any) {
      showToast(e.message || "Failed to load dashboard intelligence", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute Stats
  const activeCustomersCount = customers.filter(c => c.status === "Active").length;
  const activeLeadsCount = leads.filter(l => l.status !== "Won" && l.status !== "Lost").length;
  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.amount, 0);
  const pendingTasksCount = tasks.filter(t => !t.completed).length;

  // Compute Sales Analytics for Recharts (past months)
  const getSalesChartData = () => {
    const monthlyMap: { [key: string]: number } = {};
    // Seed some months for aesthetic fullness
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
    months.forEach(m => { monthlyMap[m] = 0; });

    sales.forEach(s => {
      try {
        const d = new Date(s.date);
        const monthName = d.toLocaleString("default", { month: "short" });
        if (monthName in monthlyMap) {
          monthlyMap[monthName] += s.amount;
        } else {
          monthlyMap[monthName] = s.amount;
        }
      } catch (_) {}
    });

    return Object.entries(monthlyMap).map(([name, Revenue]) => ({
      name,
      Revenue,
    }));
  };

  // Compute Leads Distribution
  const getLeadsChartData = () => {
    const stages = {
      New: 0,
      Contacted: 0,
      Qualified: 0,
      Proposal: 0,
      Negotiation: 0,
      Won: 0,
      Lost: 0,
    };

    leads.forEach(l => {
      if (l.status in stages) {
        stages[l.status as keyof typeof stages]++;
      }
    });

    return Object.entries(stages).map(([stage, count]) => ({
      stage,
      count,
    }));
  };

  const salesData = getSalesChartData();
  const leadsData = getLeadsChartData();

  // Create Handlers
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCustomer(customerForm);
      showToast(`Logged customer ${customerForm.name} successfully`, "success");
      setCustomerModal(false);
      setCustomerForm({ name: "", email: "", phone: "", company: "", status: "Active" });
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLead(leadForm);
      showToast(`Lead for ${leadForm.company} logged successfully`, "success");
      setLeadModal(false);
      setLeadForm({ name: "", company: "", value: "", status: "New", source: "Website" });
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTask(taskForm);
      showToast(`Task "${taskForm.title}" scheduled successfully`, "success");
      setTaskModal(false);
      setTaskForm({ title: "", description: "", priority: "Medium", dueDate: "" });
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSale(saleForm);
      showToast(`Logged sale of $${saleForm.amount} successfully`, "success");
      setSaleModal(false);
      setSaleForm({ customer: "", amount: "", product: "", date: "" });
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#64748b"];

  if (loading) {
    return <Loader fullPage />;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" id="dashboard-view">
      {/* Page Title & Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 tracking-tight">Nexus CRM Console</h1>
          <p className="text-sm text-slate-500">Live pipeline statistics, lead conversion, and real-time sales revenue metrics.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            id="qa-customer-btn"
            onClick={() => setCustomerModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 shadow-xs transition-all duration-150 cursor-pointer"
          >
            <Plus className="h-4 w-4 text-blue-600" />
            <span>Customer</span>
          </button>
          <button
            id="qa-lead-btn"
            onClick={() => setLeadModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 shadow-xs transition-all duration-150 cursor-pointer"
          >
            <Plus className="h-4 w-4 text-blue-600" />
            <span>Lead</span>
          </button>
          <button
            id="qa-sale-btn"
            onClick={() => setSaleModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 shadow-xs transition-all duration-150 cursor-pointer"
          >
            <Plus className="h-4 w-4 text-blue-600" />
            <span>Log Sale</span>
          </button>
          <button
            id="qa-task-btn"
            onClick={() => setTaskModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 shadow-sm transition-all duration-150 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Stats Bento Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Customers */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between" id="stat-card-customers">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Clients</span>
            <h3 className="text-2xl font-extrabold text-slate-900">{activeCustomersCount}</h3>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
              +10% vs last month
            </span>
          </div>
          <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2: Active Leads */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between" id="stat-card-leads">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Leads</span>
            <h3 className="text-2xl font-extrabold text-slate-900">{activeLeadsCount}</h3>
            <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full inline-block">
              {leads.filter(l => l.status === "Won").length} closed won
            </span>
          </div>
          <div className="bg-indigo-50 text-indigo-600 p-4 rounded-2xl">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3: Sales Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between" id="stat-card-sales">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sales Revenue</span>
            <h3 className="text-2xl font-extrabold text-slate-900">${totalSalesRevenue.toLocaleString()}</h3>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
              Gross Pipeline value
            </span>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4: Pending Tasks */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between" id="stat-card-tasks">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Tasks</span>
            <h3 className="text-2xl font-extrabold text-slate-900">{pendingTasksCount}</h3>
            <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full inline-block">
              {tasks.filter(t => t.completed).length} completed
            </span>
          </div>
          <div className="bg-amber-50 text-amber-600 p-4 rounded-2xl">
            <CheckSquare className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales trend Area chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs lg:col-span-2 space-y-4" id="dashboard-sales-chart">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Revenue Performance</h3>
              <p className="text-xs text-slate-400 font-medium">Monthly generated gross sales pipeline trends.</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(value: any) => [`$${value.toLocaleString()}`, "Revenue"]}
                  contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #f1f5f9" }}
                />
                <Area type="monotone" dataKey="Revenue" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead stages bar chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4" id="dashboard-leads-chart">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Lead Pipeline Funnel</h3>
            <p className="text-xs text-slate-400 font-medium">Current lead accounts per deal pipeline stage.</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadsData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="stage" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #f1f5f9" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {leadsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom section: Recent activities and upcoming tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent customers logging / Activities feed */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4" id="dashboard-recent-activities">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Recent Customer Accounts</h3>
            </div>
            <Link to="/customers" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View all clients
            </Link>
          </div>

          <div className="divide-y divide-slate-100 space-y-3.5">
            {customers.slice(0, 5).map((cust) => (
              <div key={cust.id} className="flex items-center justify-between pt-3.5 first:pt-0">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs">
                    {cust.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{cust.name}</h4>
                    <p className="text-[10px] text-slate-500 font-medium">{cust.company}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      cust.status === "Active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {cust.status}
                  </span>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    {new Date(cust.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}

            {customers.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs">
                No active client logs found.
              </div>
            )}
          </div>
        </div>

        {/* Priority action items tasks list */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4" id="dashboard-upcoming-tasks">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Priority Task Queue</h3>
            </div>
            <Link to="/tasks" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Go to task manager
            </Link>
          </div>

          <div className="divide-y divide-slate-100 space-y-3.5">
            {tasks
              .filter(t => !t.completed)
              .slice(0, 5)
              .map((task) => (
                <div key={task.id} className="flex items-center justify-between pt-3.5 first:pt-0">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">{task.title}</h4>
                    <p className="text-[10px] text-slate-400 font-medium max-w-sm truncate">{task.description}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        task.priority === "High"
                          ? "bg-rose-50 text-rose-700"
                          : task.priority === "Medium"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {task.priority} Priority
                    </span>
                    <span className="text-[9px] font-medium text-slate-400">Due {task.dueDate}</span>
                  </div>
                </div>
              ))}

            {tasks.filter(t => !t.completed).length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs">
                Awesome! All task backlogs are fully cleared.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================== QUICK ACTION MODALS ==================== */}

      {/* 1. Add Customer Modal */}
      {customerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs" id="qa-customer-modal">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setCustomerModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Log New Customer Account</span>
            </h3>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Contact Person Name</label>
                <input
                  type="text"
                  required
                  value={customerForm.name}
                  onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                  className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="e.g. Robert Johnson"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Company Name</label>
                <input
                  type="text"
                  required
                  value={customerForm.company}
                  onChange={e => setCustomerForm({ ...customerForm, company: e.target.value })}
                  className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="e.g. Apex Solutions"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Email Address</label>
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
                  className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="rjohnson@apex.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Phone Connection</label>
                <input
                  type="text"
                  value={customerForm.phone}
                  onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="+1 (555) 0199"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCustomerModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/10 transition-colors"
                >
                  Log Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Lead Modal */}
      {leadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs" id="qa-lead-modal-view">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setLeadModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span>Log New Lead Opportunity</span>
            </h3>

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Opportunity Contact Name</label>
                <input
                  type="text"
                  required
                  value={leadForm.name}
                  onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
                  className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="e.g. Olivia Taylor"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Target Enterprise / Company</label>
                <input
                  type="text"
                  required
                  value={leadForm.company}
                  onChange={e => setLeadForm({ ...leadForm, company: e.target.value })}
                  className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="e.g. Cyberdyne Systems"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Deal Value ($ USD)</label>
                <input
                  type="number"
                  required
                  value={leadForm.value}
                  onChange={e => setLeadForm({ ...leadForm, value: e.target.value })}
                  className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="25000"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Lead Funnel Source</label>
                <select
                  value={leadForm.source}
                  onChange={e => setLeadForm({ ...leadForm, source: e.target.value })}
                  className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Cold Outreach">Cold Outreach</option>
                  <option value="Partner">Partner</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setLeadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/10 transition-colors"
                >
                  Log Pipeline Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Log Sale Modal */}
      {saleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs" id="qa-sale-modal-view">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setSaleModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <span>Log Completed Revenue Sale</span>
            </h3>

            <form onSubmit={handleCreateSale} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Buying Client Company</label>
                <input
                  type="text"
                  required
                  value={saleForm.customer}
                  onChange={e => setSaleForm({ ...saleForm, customer: e.target.value })}
                  className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="e.g. Acme Corporation"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Contracted Amount ($ USD)</label>
                <input
                  type="number"
                  required
                  value={saleForm.amount}
                  onChange={e => setSaleForm({ ...saleForm, amount: e.target.value })}
                  className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="9800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Product / License Type</label>
                <input
                  type="text"
                  required
                  value={saleForm.product}
                  onChange={e => setSaleForm({ ...saleForm, product: e.target.value })}
                  className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="e.g. SaaS Premium License Bundle"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSaleModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/10 transition-colors"
                >
                  Log Sale Revenue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Add Task Modal */}
      {taskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs" id="qa-task-modal-view">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setTaskModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-blue-600" />
              <span>Schedule Operational Task</span>
            </h3>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="e.g. Schedule Weyland contract renewal call"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Detailed Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="Provide checklist items or context for follow-ups..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Priority Level</label>
                  <select
                    value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                    className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Due Date</label>
                  <input
                    type="date"
                    required
                    value={taskForm.dueDate}
                    onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setTaskModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/10 transition-colors"
                >
                  Schedule Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
