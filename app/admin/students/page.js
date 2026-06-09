"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch("/api/admin/students").then(r => {
      if (r.status === 401) { router.push("/login"); return null; }
      return r.json();
    }).then(d => { if (d) { setStudents(d); setLoading(false); } });
  }, [router]);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

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
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b", margin: 0 }}>👥 Students</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{students.length} registered students</p>
        </div>

        {/* Search */}
        <div style={{ background: "white", borderRadius: 16, padding: "12px 16px", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <input type="text" placeholder="🔍 Search students..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {/* Students list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((s, i) => {
            const pct = s.totalTasks === 0 ? 0 : Math.round((s.completedTasks / s.totalTasks) * 100);
            return (
              <div key={s.id}
                onClick={() => setSelected(selected?.id === s.id ? null : s)}
                style={{
                  background: "white", borderRadius: 16, padding: "16px 20px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)", cursor: "pointer",
                  border: selected?.id === s.id ? "1.5px solid #4F8CFF" : "1.5px solid transparent",
                  animation: `fadeSlideUp 0.4s ease ${i*0.04}s both`,
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#4F8CFF,#667eea)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                    {s.name[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: 0 }}>{s.name}</p>
                    <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>{s.email}</p>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    {[
                      { label: "Tasks",     value: s.totalTasks,     color: "#4F8CFF", bg: "#EBF1FF" },
                      { label: "Done",      value: s.completedTasks, color: "#16a34a", bg: "#dcfce7" },
                      { label: "Overdue",   value: s.overdueTasks,   color: "#dc2626", bg: "#fee2e2" },
                    ].map(stat => (
                      <div key={stat.label} style={{ textAlign: "center", padding: "4px 10px", borderRadius: 10, background: stat.bg }}>
                        <p style={{ fontSize: 14, fontWeight: 800, color: stat.color, margin: 0 }}>{stat.value}</p>
                        <p style={{ fontSize: 9, color: stat.color, margin: 0, opacity: 0.7 }}>{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expanded details */}
                {selected?.id === s.id && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: "#64748b" }}>Completion rate</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>{pct}%</span>
                    </div>
                    <div style={{ width: "100%", background: "#f1f5f9", borderRadius: 99, height: 8, overflow: "hidden", marginBottom: 12 }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#4F8CFF,#22c55e)", borderRadius: 99 }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      {[
                        { label: "Pending",      value: s.pendingTasks,  color: "#4F8CFF" },
                        { label: "High Priority",value: s.highPriority,  color: "#dc2626" },
                        { label: "Joined",       value: new Date(s.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric"}), color: "#7c3aed" },
                      ].map(d => (
                        <div key={d.label} style={{ background: "#F8FAFF", borderRadius: 10, padding: "8px 10px" }}>
                          <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 2px" }}>{d.label}</p>
                          <p style={{ fontSize: 14, fontWeight: 800, color: d.color, margin: 0 }}>{d.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ background: "white", borderRadius: 20, padding: 40, textAlign: "center" }}>
            <p style={{ color: "#94a3b8", fontSize: 14 }}>No students found</p>
          </div>
        )}
      </div>
    </>
  );
}