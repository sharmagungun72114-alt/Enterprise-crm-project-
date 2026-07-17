import React, { useState, useEffect, useCallback } from "react";
import { Plus, CheckSquare, Square, Trash2, Edit, X, Calendar, AlertTriangle, Filter, CheckCircle2, RefreshCw } from "lucide-react";
import { api } from "../services/api";
import { useApp } from "../context/AppContext";
import Loader from "../components/Loader";

export default function Tasks() {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(true);

  // Lists
  const [tasks, setTasks] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("All"); // All, Completed, Pending
  const [priorityFilter, setPriorityFilter] = useState("All"); // All, High, Medium, Low

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);

  // Form State
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "Medium" as "High" | "Medium" | "Low",
    dueDate: "",
    completed: false,
  });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getTasks();
      setTasks(res || []);
    } catch (e: any) {
      showToast(e.message || "Failed to fetch operational task queue", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleToggleComplete = async (task: any) => {
    try {
      const updatedStatus = !task.completed;
      await api.updateTask(task.id, { completed: updatedStatus });
      showToast(updatedStatus ? `Task completed: "${task.title}"` : `Task reactivated: "${task.title}"`, "success");
      fetchTasks();
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  const openAddModal = () => {
    setEditingTask(null);
    setForm({
      title: "",
      description: "",
      priority: "Medium",
      dueDate: new Date().toISOString().split("T")[0],
      completed: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (task: any) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      completed: task.completed,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Permanently remove this task from operations queue?")) {
      try {
        await api.deleteTask(id);
        showToast("Task removed from active queue", "success");
        fetchTasks();
      } catch (e: any) {
        showToast(e.message, "error");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      showToast("Please provide a task title.", "warning");
      return;
    }

    try {
      if (editingTask) {
        await api.updateTask(editingTask.id, form);
        showToast("Task updated successfully", "success");
      } else {
        await api.createTask(form);
        showToast("Task scheduled successfully", "success");
      }
      setIsModalOpen(false);
      fetchTasks();
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  // Filter lists
  const filteredTasks = tasks.filter(t => {
    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Completed" && t.completed) ||
      (statusFilter === "Pending" && !t.completed);

    const matchesPriority =
      priorityFilter === "All" ||
      t.priority === priorityFilter;

    return matchesStatus && matchesPriority;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" id="tasks-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 tracking-tight">Daily Operations Task Queue</h1>
          <p className="text-sm text-slate-500 font-medium font-sans">Organize workflow deadlines, schedule client follow-up checkups, and monitor task completion.</p>
        </div>
        <button
          id="add-task-btn"
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/10 transition-all duration-150 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Operational Task</span>
        </button>
      </div>

      {/* Filters row */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap gap-4 items-center justify-between" id="tasks-filters">
        <div className="flex flex-wrap items-center gap-4">
          {/* Status filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              id="task-status-filter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed Only</option>
              <option value="Pending">Pending Backlog</option>
            </select>
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              id="task-priority-filter"
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            >
              <option value="All">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>
        </div>

        <button
          onClick={fetchTasks}
          id="tasks-refresh-btn"
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
          title="Refresh task list"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Task Queue Content */}
      {loading ? (
        <Loader />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs divide-y divide-slate-100" id="tasks-list">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              id={`task-item-${task.id}`}
              className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                task.completed ? "bg-slate-50/40" : "hover:bg-slate-50/30"
              }`}
            >
              <div className="flex items-start gap-4 flex-1">
                {/* Completion Toggle */}
                <button
                  id={`toggle-task-btn-${task.id}`}
                  onClick={() => handleToggleComplete(task)}
                  className="mt-0.5 text-slate-400 hover:text-blue-600 transition-colors focus:outline-none cursor-pointer"
                >
                  {task.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  ) : (
                    <Square className="h-5 w-5 shrink-0 text-slate-300" />
                  )}
                </button>

                <div className="space-y-1">
                  <h4
                    className={`text-sm font-semibold transition-all ${
                      task.completed ? "line-through text-slate-400 font-medium" : "text-slate-900"
                    }`}
                  >
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className={`text-xs text-slate-500 leading-relaxed max-w-2xl ${task.completed ? "text-slate-400" : ""}`}>
                      {task.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2.5 pt-1 items-center">
                    {/* Priority badge */}
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider ${
                        task.priority === "High"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : task.priority === "Medium"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {task.priority} Priority
                    </span>

                    {/* Due Date */}
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold font-mono">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Due: {task.dueDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Operations */}
              <div className="flex justify-end items-center gap-1.5 shrink-0">
                <button
                  id={`edit-task-btn-${task.id}`}
                  onClick={() => openEditModal(task)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  title="Edit task scheduled details"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  id={`delete-task-btn-${task.id}`}
                  onClick={() => handleDelete(task.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                  title="Remove from backlog"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {filteredTasks.length === 0 && (
            <div className="text-center py-16 text-slate-400 text-sm">
              All task conditions met! Backlog is entirely clear.
            </div>
          )}
        </div>
      )}

      {/* Pop up Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs" id="task-form-modal">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-blue-600" />
              <span>{editingTask ? "Edit Operations Task" : "Log Operations Task"}</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Task Action Title</label>
                <input
                  type="text"
                  required
                  id="form-task-title"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="e.g. Schedule Weyland-Yutani contract review"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Action Description</label>
                <textarea
                  id="form-task-desc"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="e.g. Discuss Q3 licensing updates and contract renewal addendums."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Priority Tier</label>
                  <select
                    id="form-task-priority"
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value as any })}
                    className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Operational Due Date</label>
                  <input
                    type="date"
                    required
                    id="form-task-duedate"
                    value={form.dueDate}
                    onChange={e => setForm({ ...form, dueDate: e.target.value })}
                    className="mt-1 block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
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
                  id="task-form-submit-btn"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/10 transition-colors"
                >
                  {editingTask ? "Save Task" : "Log Scheduled Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
