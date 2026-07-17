import React, { useState, useEffect, useCallback } from "react";
import { Search, Plus, Filter, Edit, Trash2, ArrowLeft, ArrowRight, X, Mail, Phone, Calendar, UserPlus } from "lucide-react";
import { api } from "../services/api";
import { useApp } from "../context/AppContext";
import Loader from "../components/Loader";

export default function Customers() {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(true);

  // Lists & pagination
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "Active",
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getCustomers({
        search,
        status: statusFilter,
        page,
        limit,
      });
      setCustomers(res.customers || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalItems(res.pagination?.total || 0);
    } catch (e: any) {
      showToast(e.message || "Failed to fetch customers", "error");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, limit, showToast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page when search changes
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1); // Reset to first page when filter changes
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setForm({
      name: "",
      email: "",
      phone: "",
      company: "",
      status: "Active",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cust: any) => {
    setEditingCustomer(cust);
    setForm({
      name: cust.name,
      email: cust.email,
      phone: cust.phone,
      company: cust.company,
      status: cust.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this customer profile?")) {
      try {
        await api.deleteCustomer(id);
        showToast("Customer deleted successfully", "success");
        fetchCustomers();
      } catch (e: any) {
        showToast(e.message, "error");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.company) {
      showToast("Name and Company are required.", "warning");
      return;
    }

    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, form);
        showToast("Customer updated successfully", "success");
      } else {
        await api.createCustomer(form);
        showToast("Customer created successfully", "success");
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" id="customers-view">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 tracking-tight">Customer Database</h1>
          <p className="text-sm text-slate-500">Search and manage existing customer accounts, contacts, and metadata.</p>
        </div>
        <button
          id="add-customer-btn"
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/10 transition-all duration-150 cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center" id="customers-filters">
        <div className="relative w-full md:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            id="customer-search-input"
            value={search}
            onChange={handleSearchChange}
            className="block w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-150"
            placeholder="Search name, company, email, or phone..."
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            id="customer-status-filter"
            value={statusFilter}
            onChange={handleFilterChange}
            className="block w-full md:w-44 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Customers</option>
            <option value="Inactive">Inactive Accounts</option>
          </select>
        </div>
      </div>

      {/* Main Customers Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden" id="customers-table-container">
        {loading ? (
          <Loader />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Customer Details</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Channels</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Creation Date</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {customers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Contact Person Name */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-sm shadow-xs border border-blue-100/30">
                          {cust.name.split(" ").map((n: any) => n[0]).join("").substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">{cust.name}</h4>
                          <span className="text-xs text-slate-400">ID: {cust.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Company */}
                    <td className="px-6 py-4.5 whitespace-nowrap text-sm font-medium text-slate-700">
                      {cust.company}
                    </td>

                    {/* Contact details */}
                    <td className="px-6 py-4.5 whitespace-nowrap text-xs space-y-1">
                      {cust.email && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <span>{cust.email}</span>
                        </div>
                      )}
                      {cust.phone && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <span>{cust.phone}</span>
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          cust.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-50 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {cust.status}
                      </span>
                    </td>

                    {/* Created date */}
                    <td className="px-6 py-4.5 whitespace-nowrap text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{new Date(cust.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-4.5 whitespace-nowrap text-right text-xs font-medium space-x-2">
                      <button
                        id={`edit-customer-btn-${cust.id}`}
                        onClick={() => openEditModal(cust)}
                        className="inline-flex p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-150 cursor-pointer"
                        title="Edit Customer"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        id={`delete-customer-btn-${cust.id}`}
                        onClick={() => handleDelete(cust.id)}
                        className="inline-flex p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-150 cursor-pointer"
                        title="Delete Customer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {customers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                      No customer accounts matching filter conditions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Section Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4" id="customers-pagination">
          <span className="text-xs text-slate-500 font-semibold">
            Showing page {page} of {totalPages} ({totalItems} items total)
          </span>

          <div className="flex gap-2">
            <button
              id="cust-page-prev"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              id="cust-page-next"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal Pop up */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs" id="customer-form-modal">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              <span>{editingCustomer ? "Modify Customer Account" : "Add New Customer Account"}</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Contact Person Name</label>
                <input
                  type="text"
                  required
                  id="form-customer-name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Company Name</label>
                <input
                  type="text"
                  required
                  id="form-customer-company"
                  value={form.company}
                  onChange={e => setForm({ ...form, company: e.target.value })}
                  className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="Acme Corporation"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Email Address</label>
                <input
                  type="email"
                  id="form-customer-email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="john@acme.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Phone</label>
                <input
                  type="text"
                  id="form-customer-phone"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Customer Status</label>
                <select
                  id="form-customer-status"
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value as any })}
                  className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
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
                  id="customer-form-submit-btn"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/10 transition-colors"
                >
                  {editingCustomer ? "Save Changes" : "Log Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
