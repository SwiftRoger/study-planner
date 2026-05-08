"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [animKey, setAnimKey] = useState(0);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", subject: "", deadline: "", priority: "medium" });
  const [error, setError] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", subject: "", deadline: "", priority: "medium" });
  const [suggestions, setSuggestions] = useState([]);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestFor, setSuggestFor] = useState(null);
  

  useEffect(() => { fetchTasks(); }, []);

  async function fetchTasks() {
    const res = await fetch("/api/tasks");
    if (res.status === 401) { router.push("/login"); return; }
    const data = await res.json();
    setTasks(data);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) { const data = await res.json(); setError(data.message); return; }
    setForm({ title: "", subject: "", deadline: "", priority: "medium" });
    setShowForm(false);
    fetchTasks();
  }

  async function handleStatusChange(id, status) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchTasks();
  }

  async function handleDelete(id) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    fetchTasks();
  }

  function startEdit(task) {
    setEditingTask(task.id);
    setEditForm({
      title: task.title,
      subject: task.subject,
      deadline: new Date(task.deadline).toISOString().slice(0, 16),
      priority: task.priority,
    });
  }

  async function handleEdit(e) {
    e.preventDefault();
    await fetch(`/api/tasks/${editingTask}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editForm, isEdit: true }),
    });
    setEditingTask(null);
    fetchTasks();
  }

  async function getSuggestions(task) {
    setSuggestFor(task.id);
    setSuggesting(true);
    setSuggestions([]);
    const res = await fetch("/api/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: task.subject,
        deadline: task.deadline,
        priority: task.priority,
      }),
    });
    const data = await res.json();
    setSuggestions(data.suggestions || []);
    setSuggesting(false);
  }

  function getDaysLeft(deadline) {
    const diff = new Date(deadline) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return "Overdue";
    if (days === 0) return "Due today";
    return `${days}d left`;
  }

  function getPriorityStyle(priority) {
    if (priority === "high") return "bg-red-100 text-red-600";
    if (priority === "medium") return "bg-yellow-100 text-yellow-600";
    return "bg-green-100 text-green-600";
  }

  function getStatusStyle(task) {
    if (task.status === "completed") return "bg-green-100 text-green-600";
    if (new Date(task.deadline) < new Date()) return "bg-red-100 text-red-600";
    return "bg-[#EBF1FF] text-[#4F8CFF]";
  }

  function getStatusLabel(task) {
    if (task.status === "completed") return "Completed";
    if (new Date(task.deadline) < new Date()) return "Overdue";
    return "Pending";
  }

  const filtered = tasks
    .filter((t) => {
      if (filter === "completed") return t.status === "completed";
      if (filter === "pending") return t.status === "pending" && new Date(t.deadline) >= new Date();
      if (filter === "overdue") return t.status === "pending" && new Date(t.deadline) < new Date();
      return true;
    })
    .filter((t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase())
    );

  
  return (
  <div className="max-w-5xl mx-auto relative">

    {/* Floating shapes */}
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="animate-float absolute top-10 right-10 w-24 h-24 rounded-full opacity-5"
        style={{ background: "linear-gradient(135deg, #4F8CFF, #667eea)" }} />
      <div className="animate-float-delayed absolute bottom-20 left-10 w-16 h-16 opacity-5"
        style={{ background: "linear-gradient(135deg, #a8edea, #4F8CFF)", borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%" }} />
      <div className="animate-pulse-slow absolute top-1/2 right-20 w-32 h-32 rounded-full opacity-3"
        style={{ background: "radial-gradient(circle, #4F8CFF 0%, transparent 70%)" }} />
    </div>

    <div className="relative z-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tasks</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and organize your tasks</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl bg-[#4F8CFF] text-white text-sm font-medium hover:bg-[#3a7ae0] transition-colors">
          + Add Task
        </button>
      </div>

      {/* Add Task Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">New Task</h2>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Task Title</label>
              <input type="text" placeholder="e.g. Math Assignment" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]" required />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Subject</label>
              <input type="text" placeholder="e.g. Mathematics" value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]" required />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Deadline</label>
              <input type="datetime-local" value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]" required />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="md:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50">Cancel</button>
              <button type="submit"
                className="px-4 py-2 rounded-xl bg-[#4F8CFF] text-white text-sm hover:bg-[#3a7ae0]">Save Task</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter + Search */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2">
          {["all", "pending", "completed", "overdue"].map((f) => (
            <button key={f} onClick={() => { setFilter(f); setAnimKey(k => k + 1); }}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium capitalize transition-colors ${
                filter === f ? "bg-[#4F8CFF] text-white" : "text-slate-500 hover:bg-[#EBF1FF] hover:text-[#4F8CFF]"
              }`}>
              {f}
            </button>
          ))}
        </div>
        <input type="text" placeholder="Search tasks..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8CFF] w-full md:w-64" />
      </div>

      {/* Task Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F0F4FF] text-slate-500 text-sm">
            <tr>
              <th className="text-left px-6 py-4 font-medium">Task Title</th>
              <th className="text-left px-6 py-4 font-medium">Subject</th>
              <th className="text-left px-6 py-4 font-medium">Priority</th>
              <th className="text-left px-6 py-4 font-medium">Deadline</th>
              <th className="text-left px-6 py-4 font-medium">Status</th>
              <th className="text-left px-6 py-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100" key={animKey}>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-slate-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-slate-400">No tasks found</td></tr>
            ) : (
              filtered.map((task) => (
                <tr key={task.id} className="hover:bg-[#F8FAFF] transition-all card-hover"
                  style={{ animation: "fadeSlideUp 0.4s ease forwards" }}>
                  <td className="px-6 py-4">
                    <p className={`font-medium text-sm ${task.status === "completed" ? "line-through text-slate-400" : "text-slate-800"}`}>
                      {task.title}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{task.subject}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${getPriorityStyle(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(task.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    <span className={`ml-2 text-xs ${new Date(task.deadline) < new Date() && task.status !== "completed" ? "text-red-500" : "text-slate-400"}`}>
                      ({getDaysLeft(task.deadline)})
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusStyle(task)}`}>
                      {getStatusLabel(task)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={task.status === "completed"}
                        onChange={(e) => handleStatusChange(task.id, e.target.checked ? "completed" : "pending")}
                        className="w-4 h-4 accent-[#4F8CFF] cursor-pointer" title="Mark complete" />
                      <button onClick={() => startEdit(task)}
                        className="text-slate-400 hover:text-[#4F8CFF] transition-colors" title="Edit">✏️</button>
                      <button onClick={() => getSuggestions(task)}
                        className="text-slate-400 hover:text-purple-400 transition-colors" title="AI Suggestions">🤖</button>
                      <button onClick={() => handleDelete(task.id)}
                        className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none" title="Delete">✕</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Edit Task</h2>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Task Title</label>
                <input type="text" value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]" required />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Subject</label>
                <input type="text" value={editForm.subject}
                  onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]" required />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Deadline</label>
                <input type="datetime-local" value={editForm.deadline}
                  onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]" required />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Priority</label>
                <select value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setEditingTask(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50">Cancel</button>
                <button type="submit"
                  className="px-4 py-2 rounded-xl bg-[#4F8CFF] text-white text-sm hover:bg-[#3a7ae0]">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Suggestions Modal */}
      {suggestFor && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">🤖 AI Study Suggestions</h2>
              <button onClick={() => { setSuggestFor(null); setSuggestions([]); }}
                className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            {suggesting ? (
              <div className="py-8 text-center">
                <div className="w-8 h-8 border-4 border-[#4F8CFF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Generating suggestions...</p>
              </div>
            ) : suggestions.length === 0 ? (
              <p className="text-slate-400 text-center py-6 text-sm">No suggestions available</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-slate-500 mb-3">Here are 4 subtasks to help you prepare:</p>
                {suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-[#F0F4FF] rounded-xl">
                    <span className="w-6 h-6 bg-[#4F8CFF] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-sm text-slate-700">{s}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  </div>
  );
}