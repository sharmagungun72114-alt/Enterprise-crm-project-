import React, { useState, useEffect, useCallback } from "react";
import { Search, Plus, Filter, Edit, Trash2, X, TrendingUp, DollarSign, Tag, Users, AlertCircle } from "lucide-react";
import { api } from "../services/api";
import { useApp } from "../context/AppContext";
import Loader from "../components/Loader";

export default function Leads() {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(true);

  // States
  const [leads, setLeads] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: "",
    company: "",
    value: "",
    status: "New",
    source: "Website",
  });

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getLeads({
        search,
        status: statusFilter,
      });
      setLeads(res || []);
    } catch (e: any) {
      showToast(e.message || "Failed to fetch lead records", "error");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, showToast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const openAddModal = () => {
    setEditingLead(null);
    setForm({
      name: "",
      company: "",
      value: "",
      status: "New",
      source: "Website",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (lead: any) => {
    setEditingLead(lead);
    setForm({
      name: lead.name,
      company: lead.company,
      value: String(lead.value),
      status: lead.status,
      source: lead.source,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this lead opportunity?")) {
      try {
        await api.deleteLead(id);
        showToast("Lead record removed", "success");
        fetchLeads();
      } catch (e: any) {
        showToast(e.message, "error");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.company || !form.value) {
      showToast("All fields are required.", "warning");
      return;
    }

    try {
      if (editingLead) {
        await api.updateLead(editingLead.id, form);
        if (form.status === "Won" && editingLead.status !== "Won") {
          showToast("Lead marked as WON! Account converted to active client and sales contract generated.", "success");
        } else {
          showToast("Lead updated successfully", "success");
        }
      } else {
        await api.createLead(form);
        showToast("Lead pipeline opportunity created", "success");
      }
      setIsModalOpen(false);
      fetchLeads();
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "New":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Contacted":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "Qualified":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Proposal":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Negotiation":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Won":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Lost":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" id="leads-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 tracking-tight">Leads & Pipeline Opportunities</h1>
          <p className="text-sm text-slate-500">Qualify prospective accounts and manage deal values through conversion stages.</p>
        </div>
        <button
          id="add-lead-btn"
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/10 transition-all duration-150 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Lead Opportunity</span>
        </button>
      </div>

      {/* Info notice about Won lead promo */}
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3 text-blue-900 text-xs font-medium" id="leads-promo-notice">
        <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-sm text-blue-950 mb-0.5">Automated Client Promotion</span>
          When you mark any Lead stage as <span className="font-bold text-emerald-700 uppercase">"Won"</span>, the Enterprise engine automatically converts their account details into the active Customer database and logs a matching Sale transaction in the financial ledger!
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center" id="leads-filters">
        <div className="relative w-full md:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            id="lead-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-150"
            placeholder="Search prospective contact or company..."
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            id="lead-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full md:w-44 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          >
            <option value="All">All Funnel Stages</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Proposal">Proposal</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Won">Won (Closed)</option>
            <option value="Lost">Lost (Closed)</option>
          </select>
        </div>
      </div>

      {/* Leads Grid list */}
      {loading ? (
        <Loader />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="leads-cards-grid">
          {leads.map((lead) => (
            <div
              key={lead.id}
              id={`lead-card-${lead.id}`}
              className="bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md hover:border-slate-200/80 transition-all duration-200 overflow-hidden flex flex-col h-full"
            >
              {/* Card Header details */}
              <div className="p-5 flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Prospect Contact</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">{lead.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">{lead.company}</p>
                  </div>

                  <span
                    className={`inline-block px-2.5 py-1 text-[10px] font-bold border rounded-full uppercase tracking-wider ${getStageColor(
                      lead.status
                    )}`}
                  >
                    {lead.status}
                  </span>
                </div>

                {/* Money statistics block */}
                <div className="bg-slate-50/70 p-3.5 rounded-xl flex items-center justify-between border border-slate-100/50">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                    <DollarSign className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Contract Valuation</span>
                  </div>
                  <span className="text-sm font-extrabold text-slate-900">${lead.value.toLocaleString()}</span>
                </div>

                {/* Extra stats */}
                <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-500 font-medium">
                  <div className="flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>Source: {lead.source}</span>
                  </div>
                  <div className="text-right">
                    <span>Logged: {new Date(lead.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/20 flex justify-end gap-1.5 shrink-0">
                <button
                  id={`edit-lead-btn-${lead.id}`}
                  onClick={() => openEditModal(lead)}
                  className="inline-flex p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  title="Modify pipeline metrics"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  id={`delete-lead-btn-${lead.id}`}
                  onClick={() => handleDelete(lead.id)}
                  className="inline-flex p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                  title="Remove lead"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {leads.length === 0 && (
            <div className="text-center py-16 col-span-full bg-white rounded-2xl border border-slate-100 shadow-xs text-slate-400 text-sm">
              No active lead opportunities in pipeline.
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs" id="lead-form-modal">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span>{editingLead ? "Edit Deal Details" : "Log Pipeline Deal"}</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Contact Person Name</label>
                <input
                  type="text"
                  required
                  id="form-lead-name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="Olivia Taylor"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Corporate Target Company</label>
                <input
                  type="text"
                  required
                  id="form-lead-company"
                  value={form.company}
                  onChange={e => setForm({ ...form, company: e.target.value })}
                  className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="Cyberdyne Systems"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Estimated Deal Value ($ USD)</label>
                <input
                  type="number"
                  required
                  id="form-lead-value"
                  value={form.value}
                  onChange={e => setForm({ ...form, value: e.target.value })}
                  className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="28000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Lead Stage</label>
                  <select
                    id="form-lead-status"
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Won">Won (Closed)</option>
                    <option value="Lost">Lost (Closed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Lead Channel Source</label>
                  <select
                    id="form-lead-source"
                    value={form.source}
                    onChange={e => setForm({ ...form, source: e.target.value })}
                    className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Cold Outreach">Cold Outreach</option>
                    <option value="Partner">Partner</option>
                  </select>
                </div>
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
                  id="lead-form-submit-btn"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/10 transition-colors"
                >
                  {editingLead ? "Save Deal" : "Create Deal Opportunity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
