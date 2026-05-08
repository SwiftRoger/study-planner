"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProgressPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchTasks() {
    const res = await fetch("/api/tasks");
    if (res.status === 401) { router.push("/login"); return; }
    const data = await res.json();
    setTasks(data);
    setLoading(false);
  }
   
  useEffect(() => { fetchTasks(); }, []);

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const pending = tasks.filter((t) => t.status === "pending").length;
  const overdue = tasks.filter((t) => t.status === "pending" && new Date(t.deadline) < new Date()).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  const bySubject = tasks.reduce((acc, task) => {
    if (!acc[task.subject]) acc[task.subject] = { total: 0, completed: 0 };
    acc[task.subject].total++;
    if (task.status === "completed") acc[task.subject].completed++;
    return acc;
  }, {});

  const weeklyData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayTasks = tasks.filter((t) => new Date(t.createdAt).toDateString() === d.toDateString());
    const doneTasks = dayTasks.filter((t) => t.status === "completed");
    return {
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      total: dayTasks.length,
      done: doneTasks.length,
    };
  });
  const maxVal = Math.max(...weeklyData.map((d) => d.total), 1);

  return (
  <div className="max-w-5xl mx-auto relative">
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="animate-float absolute top-20 right-20 w-32 h-32 opacity-5"
        style={{ background: "linear-gradient(135deg, #4F8CFF, #a8edea)", borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%" }} />
      <div className="animate-pulse-slow absolute bottom-20 left-20 w-24 h-24 rounded-full opacity-5"
        style={{ background: "radial-gradient(circle, #667eea 0%, transparent 70%)" }} />
    </div>
    <div className="relative z-10">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Progress</h1>
        <p className="text-slate-500 text-sm mt-1">Track your study progress and performance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Tasks", value: total, color: "text-slate-800", bg: "from-slate-50 to-white" },
          { label: "Completed", value: completed, color: "text-green-600", bg: "from-green-50 to-white" },
          { label: "Pending", value: pending, color: "text-[#4F8CFF]", bg: "from-blue-50 to-white" },
          { label: "Overdue", value: overdue, color: "text-red-500", bg: "from-red-50 to-white" },
        ].map((stat) => (
          <div key={stat.label} className={`bg-gradient-to-br ${stat.bg} rounded-2xl shadow-sm p-5 text-center card-hover`}>
            <p className="text-slate-500 text-sm">{stat.label}</p>
            <h2 className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</h2>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Overall Progress */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Overall Progress</h2>
            <span className="text-2xl font-bold text-[#4F8CFF]">{percent}%</span>
          </div>
          <div className="w-full bg-[#EBF1FF] rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#4F8CFF] to-[#7EB3FF] h-4 rounded-full transition-all duration-700"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-sm text-slate-400 mt-3">{completed} of {total} tasks completed</p>

          {/* Circular progress */}
          <div className="flex justify-center mt-6">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#EBF1FF" strokeWidth="12" />
                <circle cx="60" cy="60" r="50" fill="none"
                  stroke="url(#gradient)" strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - percent / 100)}`}
                  strokeLinecap="round" />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4F8CFF" />
                    <stop offset="100%" stopColor="#7EB3FF" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-800">{percent}%</span>
                <span className="text-xs text-slate-400">Done</span>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Summary */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Weekly Summary</h2>
          <div className="flex items-end justify-between gap-2" style={{ height: "120px" }}>
            {weeklyData.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full flex flex-col justify-end gap-0.5" style={{ height: "100px" }}>
                  <div className="w-full bg-gradient-to-t from-[#4F8CFF] to-[#7EB3FF] rounded-t-lg transition-all duration-500"
                    style={{ height: `${Math.max((day.done / maxVal) * 100, day.done > 0 ? 8 : 0)}px` }} />
                  <div className="w-full bg-[#EBF1FF] rounded-t-lg transition-all duration-500"
                    style={{ height: `${Math.max(((day.total - day.done) / maxVal) * 100, (day.total - day.done) > 0 ? 8 : 0)}px` }} />
                </div>
                <span className="text-xs text-slate-400">{day.label}</span>
                <span className="text-xs font-medium text-slate-600">{day.total}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-[#4F8CFF] to-[#7EB3FF]" /> Completed
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="w-3 h-3 rounded-sm bg-[#EBF1FF]" /> Pending
            </div>
          </div>
        </div>
      </div>

      {/* Progress by Subject */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Progress by Subject</h2>
        {Object.keys(bySubject).length === 0 ? (
          <p className="text-slate-400 text-center py-6">No tasks yet</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(bySubject).map(([subject, data]) => {
              const subPercent = Math.round((data.completed / data.total) * 100);
              return (
                <div key={subject}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700">{subject}</span>
                    <span className="text-slate-500">{data.completed}/{data.total} tasks ({subPercent}%)</span>
                  </div>
                  <div className="w-full bg-[#EBF1FF] rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-[#4F8CFF] to-[#7EB3FF] h-3 rounded-full transition-all duration-700"
                      style={{ width: `${subPercent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* All Tasks */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">All Tasks</h2>
        {loading ? (
          <p className="text-slate-400 text-center py-6">Loading...</p>
        ) : tasks.length === 0 ? (
          <p className="text-slate-400 text-center py-6">No tasks yet</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 bg-[#F8FAFF] rounded-xl hover:bg-[#EBF1FF] transition-colors">
                <div>
                  <p className={`font-medium text-sm ${task.status === "completed" ? "line-through text-slate-400" : "text-slate-800"}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{task.subject}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  task.status === "completed" ? "bg-green-100 text-green-700" :
                  new Date(task.deadline) < new Date() ? "bg-red-100 text-red-700" :
                  "bg-[#EBF1FF] text-[#4F8CFF]"
                }`}>
                  {task.status === "completed" ? "Completed" : new Date(task.deadline) < new Date() ? "Overdue" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}