import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Calendar, ShoppingBag, Users, Layers, ArrowUpRight, DollarSign } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { api } from "../services/api";
import { useApp } from "../context/AppContext";
import Loader from "../components/Loader";

export default function Reports() {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await api.getReports();
        setData(res);
      } catch (e: any) {
        showToast(e.message || "Failed to load reports pipeline data", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, [showToast]);

  if (loading) {
    return <Loader fullPage />;
  }

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#64748b"];

  // Fallback to empty arrays if null
  const customerGrowth = data?.customerGrowth || [];
  const leadConversion = data?.leadConversion || [];
  const monthlyRevenue = data?.monthlyRevenue || [];
  const salesPerformance = data?.salesPerformance || [];

  // Compute Total Metrics
  const totalRevenue = monthlyRevenue.reduce((sum: number, r: any) => sum + r.amount, 0);
  const totalLeads = leadConversion.reduce((sum: number, l: any) => sum + l.count, 0);
  const wonLeads = leadConversion.find((l: any) => l.stage === "Won")?.count || 0;
  const leadConversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;
  const totalClientsAdded = customerGrowth.reduce((sum: number, c: any) => sum + c.count, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" id="reports-view">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 tracking-tight">Corporate Intelligence & Analytics</h1>
          <p className="text-sm text-slate-500 font-medium">Evaluate business growth curves, deal conversion funnels, and monthly financial ledger sheets.</p>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" id="reports-metrics-row">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gross Ledger Closed</span>
            <span className="text-xl font-extrabold text-slate-900">${totalRevenue.toLocaleString()}</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Lead Conversion Efficiency</span>
            <span className="text-xl font-extrabold text-slate-900">{leadConversionRate}% Rate</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Accounts Onboarded</span>
            <span className="text-xl font-extrabold text-slate-900">+{totalClientsAdded} Clients</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="reports-charts-grid">
        {/* 1. Revenue Report (Monthly Curve) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4" id="report-chart-revenue">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500 shrink-0" />
              <span>Revenue Growth curve</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Closed monthly sales contracts invoice summaries.</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMonthlyRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(value: any) => [`$${value.toLocaleString()}`, "Gross Revenue"]}
                  contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #f1f5f9" }}
                />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorMonthlyRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Customer Growth curve */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4" id="report-chart-customers">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500 shrink-0" />
              <span>Customer Base growth</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Tracking monthly client onboarding rates.</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={customerGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(value: any) => [value, "Clients Onboarded"]}
                  contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #f1f5f9" }}
                />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Lead Conversion Funnel (Bar) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4" id="report-chart-leads">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-500 shrink-0" />
              <span>Prospect Pipeline Distribution</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Total count of prospective leads per negotiation funnel tier.</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadConversion} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="stage" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #f1f5f9" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {leadConversion.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Sales performance by product line */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4" id="report-chart-products">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-amber-500 shrink-0" />
              <span>Product Line performance</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Gross contract sales sums grouped per license product.</p>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {salesPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesPerformance}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="amount"
                    nameKey="product"
                  >
                    {salesPerformance.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`$${value.toLocaleString()}`, "Product Sales"]}
                    contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #f1f5f9" }}
                  />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400">No active products logged.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
