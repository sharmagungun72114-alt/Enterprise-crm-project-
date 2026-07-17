import React, { useState, useEffect, useCallback } from "react";
import { Search, Plus, Trash2, Edit, X, DollarSign, Award, Calendar, Layers, ShieldCheck, ShoppingBag } from "lucide-react";
import { api } from "../services/api";
import { useApp } from "../context/AppContext";
import Loader from "../components/Loader";

export default function Sales() {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(true);

  // States
  const [sales, setSales] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<any | null>(null);

  // Form State
  const [form, setForm] = useState({
    customer: "",
    amount: "",
    product: "",
    date: "",
  });

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getSales({ search });
      setSales(res || []);
    } catch (e: any) {
      showToast(e.message || "Failed to fetch sales database", "error");
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const openAddModal = () => {
    setEditingSale(null);
    setForm({
      customer: "",
      amount: "",
      product: "",
      date: new Date().toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (sale: any) => {
    setEditingSale(sale);
    setForm({
      customer: sale.customer,
      amount: String(sale.amount),
      product: sale.product,
      date: sale.date.split("T")[0],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this transaction ledger entry?")) {
      try {
        await api.deleteSale(id);
        showToast("Sale transaction deleted", "success");
        fetchSales();
      } catch (e: any) {
        showToast(e.message, "error");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer || !form.amount || !form.product) {
      showToast("Please supply buying client, amount, and product.", "warning");
      return;
    }

    try {
      if (editingSale) {
        await api.updateSale(editingSale.id, form);
        showToast("Sales ledger updated", "success");
      } else {
        await api.createSale(form);
        showToast("Sale logged successfully", "success");
      }
      setIsModalOpen(false);
      fetchSales();
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  // Compute stats
  const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0);
  const averageDealValue = sales.length > 0 ? Math.round(totalRevenue / sales.length) : 0;
  const highestSale = sales.length > 0 ? Math.max(...sales.map(s => s.amount)) : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" id="sales-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 tracking-tight">Sales Pipeline Ledger</h1>
          <p className="text-sm text-slate-500 font-medium">Review closed business, log corporate contracts, and calculate invoice performance.</p>
        </div>
        <button
          id="add-sale-btn"
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/10 transition-all duration-150 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Log Revenue Contract</span>
        </button>
      </div>

      {/* Analytics stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" id="sales-stats-row">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gross Revenue</span>
            <span className="text-lg font-extrabold text-slate-900">${totalRevenue.toLocaleString()}</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Average Deal Size</span>
            <span className="text-lg font-extrabold text-slate-900">${averageDealValue.toLocaleString()}</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Peak Contract Value</span>
            <span className="text-lg font-extrabold text-slate-900">${highestSale.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Search filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex justify-between items-center" id="sales-filters">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            id="sale-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-150"
            placeholder="Search buyer client or product license..."
          />
        </div>
      </div>

      {/* Table block */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden" id="sales-table-container">
        {loading ? (
          <Loader />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Buying Client</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Product / Service</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Transaction Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Invoice Value</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Buying Client */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{sale.customer}</span>
                      </div>
                    </td>

                    {/* Product */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{sale.product}</span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{new Date(sale.date).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-emerald-600">
                      ${sale.amount.toLocaleString()}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium space-x-1">
                      <button
                        id={`edit-sale-btn-${sale.id}`}
                        onClick={() => openEditModal(sale)}
                        className="inline-flex p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit Invoice details"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        id={`delete-sale-btn-${sale.id}`}
                        onClick={() => handleDelete(sale.id)}
                        className="inline-flex p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Delete Invoice Entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {sales.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 text-sm">
                      No transactional sales records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pop up Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs" id="sale-form-modal">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <span>{editingSale ? "Modify Invoice details" : "Log Completed Revenue Sale"}</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Buying Client Company</label>
                <input
                  type="text"
                  required
                  id="form-sale-customer"
                  value={form.customer}
                  onChange={e => setForm({ ...form, customer: e.target.value })}
                  className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="Acme Corporation"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Contract Value ($ USD)</label>
                <input
                  type="number"
                  required
                  id="form-sale-amount"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="9800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Product / Software Licenses Delivered</label>
                <input
                  type="text"
                  required
                  id="form-sale-product"
                  value={form.product}
                  onChange={e => setForm({ ...form, product: e.target.value })}
                  className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="Nexus CRM Suite"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Contract Signing Date</label>
                <input
                  type="date"
                  required
                  id="form-sale-date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="sale-form-submit-btn"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/10 transition-colors"
                >
                  {editingSale ? "Save Record" : "Log Ledger Sale"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
