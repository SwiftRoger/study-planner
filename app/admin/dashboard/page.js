"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats").then(r => r.json()).then(d => {
      setStats(d);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ width: 32, height: 32, border: "3px solid #4F8CFF", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`@keyframes fadeSlideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1e293b", margin: 0 }}>⚙️ Admin Dashboard</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Total Students", value: stats?.totalStudents || 0,   color: "#4F8CFF", icon: "👥", bg: "#EBF1FF" },
            { label: "Total Tasks",    value: stats?.totalTasks || 0,      color: "#7c3aed", icon: "📋", bg: "#ede9fe" },
            { label: "Completed",      value: stats?.completedTasks || 0,  color: "#16a34a", icon: "✅", bg: "#dcfce7" },
            { label: "Active Surveys", value: stats?.activeSurveys || 0,   color: "#f97316", icon: "📝", bg: "#ffedd5" },
            { label: "Responses",      value: stats?.totalResponses || 0,  color: "#0891b2", icon: "💬", bg: "#cffafe" },
          ].map((s, i) => (
            <div key={s.label} style={{
              background: "white", borderRadius: 16, padding: "18px 16px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
              animation: `fadeSlideUp 0.4s ease ${i*0.07}s both`,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>{s.label.toUpperCase()}</span>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{s.icon}</div>
              </div>
              <p style={{ fontSize: 30, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

          {/* Completion rate */}
          <div style={{ background: "white", borderRadius: 20, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>📊 Overall Completion Rate</h2>
            {stats?.totalTasks > 0 ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "#64748b" }}>Tasks completed</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>
                    {Math.round((stats.completedTasks / stats.totalTasks) * 100)}%
                  </span>
                </div>
                <div style={{ width: "100%", background: "#f1f5f9", borderRadius: 99, height: 10, overflow: "hidden" }}>
                  <div style={{ width: `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%`, height: "100%", background: "linear-gradient(90deg,#4F8CFF,#22c55e)", borderRadius: 99, transition: "width 1s ease" }} />
                </div>
                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>{stats.completedTasks} of {stats.totalTasks} tasks completed</p>
              </>
            ) : (
              <p style={{ color: "#94a3b8", fontSize: 13 }}>No tasks yet</p>
            )}
          </div>

          {/* Quick links */}
          <div style={{ background: "white", borderRadius: 20, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>⚡ Quick Actions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { href: "/admin/students", label: "View All Students", icon: "👥", color: "#4F8CFF" },
                { href: "/admin/surveys",  label: "Create New Survey",  icon: "➕", color: "#16a34a" },
                { href: "/admin/responses",label: "View Responses",     icon: "📋", color: "#7c3aed" },
              ].map(l => (
                <Link key={l.href} href={l.href} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", borderRadius: 12,
                  background: "#F8FAFF", textDecoration: "none",
                  border: "1.5px solid #e0e7ff",
                  fontSize: 13, fontWeight: 600, color: l.color,
                  transition: "all 0.15s",
                }}>
                  <span>{l.icon}</span> {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent students */}
        <div style={{ background: "white", borderRadius: 20, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: 0 }}>👥 Recent Students</h2>
            <Link href="/admin/students" style={{ fontSize: 12, color: "#4F8CFF", textDecoration: "none", fontWeight: 600 }}>View all →</Link>
          </div>
          {!stats?.recentStudents?.length ? (
            <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No students yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {stats.recentStudents.map((s, i) => (
                <div key={s.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", borderRadius: 12, background: "#F8FAFF",
                  animation: `fadeSlideUp 0.4s ease ${i*0.05}s both`,
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#4F8CFF,#667eea)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 14 }}>
                    {s.name[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", margin: 0 }}>{s.name}</p>
                    <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>{s.email}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#4F8CFF", margin: 0 }}>{s._count?.tasks || 0} tasks</p>
                    <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>
                      {new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}