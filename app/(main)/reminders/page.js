"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RemindersPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTasks(); }, []);

  async function fetchTasks() {
    const res = await fetch("/api/tasks");
    if (res.status === 401) { router.push("/login"); return; }
    const data = await res.json();
    setTasks(data);
    setLoading(false);
  }

  function getDaysLeft(deadline) {
    const diff = new Date(deadline) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  const overdue = tasks.filter(
    (t) => t.status === "pending" && getDaysLeft(t.deadline) < 0
  );
  const dueToday = tasks.filter(
    (t) => t.status === "pending" && getDaysLeft(t.deadline) === 0
  );
  const dueSoon = tasks.filter(
    (t) => t.status === "pending" && getDaysLeft(t.deadline) > 0 && getDaysLeft(t.deadline) <= 3
  );
  const upcoming = tasks.filter(
    (t) => t.status === "pending" && getDaysLeft(t.deadline) > 3
  );

  function ReminderCard({ task, type }) {
    const daysLeft = getDaysLeft(task.deadline);
    const styles = {
      overdue: { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-600", icon: "🚨", label: "Overdue" },
      today: { bg: "bg-orange-50", border: "border-orange-200", badge: "bg-orange-100 text-orange-600", icon: "⏰", label: "Due Today" },
      soon: { bg: "bg-yellow-50", border: "border-yellow-200", badge: "bg-yellow-100 text-yellow-600", icon: "⚠️", label: `${daysLeft}d left` },
      upcoming: { bg: "bg-[#F0F4FF]", border: "border-[#D0E1FF]", badge: "bg-[#EBF1FF] text-[#4F8CFF]", icon: "📅", label: `${daysLeft}d left` },
    };
    const s = styles[type];

    return (
      <div className={`${s.bg} border ${s.border} rounded-xl p-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{s.icon}</span>
          <div>
            <p className="font-medium text-slate-800 text-sm">{task.title}</p>
            <p className="text-xs text-slate-500">{task.subject} · Due {new Date(task.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${
            task.priority === "high" ? "bg-red-100 text-red-600" :
            task.priority === "medium" ? "bg-yellow-100 text-yellow-600" :
            "bg-green-100 text-green-600"
          }`}>
            {task.priority}
          </span>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${s.badge}`}>
            {s.label}
          </span>
        </div>
      </div>
    );
  }

  return (
  <div className="max-w-3xl mx-auto relative">
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="animate-float absolute top-10 right-10 w-24 h-24 rounded-full opacity-5"
        style={{ background: "linear-gradient(135deg, #ff6b6b, #ffd93d)" }} />
      <div className="animate-float-delayed absolute bottom-20 left-10 w-16 h-16 opacity-5"
        style={{ background: "linear-gradient(135deg, #4F8CFF, #667eea)", borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }} />
    </div>
    <div className="relative z-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Reminders</h1>
        <p className="text-slate-500 text-sm mt-1">Stay on top of your deadlines</p>
      </div>

      {loading ? (
        <p className="text-slate-400 text-center py-10">Loading...</p>
      ) : tasks.filter(t => t.status === "pending").length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-slate-600 font-medium">All caught up!</p>
          <p className="text-slate-400 text-sm mt-1">No pending tasks right now</p>
        </div>
      ) : (
        <div className="space-y-6">
          {overdue.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-red-500 uppercase tracking-wide mb-3">
                🚨 Overdue ({overdue.length})
              </h2>
              <div className="space-y-2">
                {overdue.map(t => <ReminderCard key={t.id} task={t} type="overdue" />)}
              </div>
            </div>
          )}
          {dueToday.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-orange-500 uppercase tracking-wide mb-3">
                ⏰ Due Today ({dueToday.length})
              </h2>
              <div className="space-y-2">
                {dueToday.map(t => <ReminderCard key={t.id} task={t} type="today" />)}
              </div>
            </div>
          )}
          {dueSoon.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-yellow-500 uppercase tracking-wide mb-3">
                ⚠️ Due Soon — within 3 days ({dueSoon.length})
              </h2>
              <div className="space-y-2">
                {dueSoon.map(t => <ReminderCard key={t.id} task={t} type="soon" />)}
              </div>
            </div>
          )}
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[#4F8CFF] uppercase tracking-wide mb-3">
                📅 Upcoming ({upcoming.length})
              </h2>
              <div className="space-y-2">
                {upcoming.map(t => <ReminderCard key={t.id} task={t} type="upcoming" />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
    </div>
  );
}