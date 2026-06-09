"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const DEFAULT_QUESTIONS = [
  { question: "The system is easy to use and navigate.", category: "Usability" },
  { question: "The AI study planner generates useful and accurate study schedules.", category: "Functionality" },
  { question: "Lucy (AI companion) provides helpful recommendations.", category: "Functionality" },
  { question: "The system helps me manage my tasks effectively.", category: "Effectiveness" },
  { question: "The reminder and deadline features are useful.", category: "Functionality" },
  { question: "The progress tracking helps me monitor my academic performance.", category: "Effectiveness" },
  { question: "The system responds quickly and without errors.", category: "Efficiency" },
  { question: "I am satisfied with the overall system.", category: "Satisfaction" },
  { question: "I would recommend this system to other students.", category: "Satisfaction" },
  { question: "The Khmer/English language support is helpful.", category: "Usability" },
];

export default function AdminSurveysPage() {
  const router = useRouter();
  const [surveys, setSurveys]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [creating, setCreating]   = useState(false);
  const [form, setForm]           = useState({ title: "", description: "" });
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS.map((q, i) => ({ ...q, order: i })));

  useEffect(() => { fetchSurveys(); }, []);

  async function fetchSurveys() {
    const r = await fetch("/api/admin/surveys");
    if (r.status === 401) { router.push("/login"); return; }
    const d = await r.json();
    setSurveys(d);
    setLoading(false);
  }

  async function createSurvey() {
    if (!form.title) return;
    setCreating(true);
    await fetch("/api/admin/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, questions }),
    });
    setForm({ title: "", description: "" });
    setQuestions(DEFAULT_QUESTIONS.map((q, i) => ({ ...q, order: i })));
    setShowForm(false);
    setCreating(false);
    fetchSurveys();
  }

  async function toggleSurvey(id, isActive) {
    await fetch(`/api/admin/surveys/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchSurveys();
  }

  async function deleteSurvey(id) {
    if (!confirm("Delete this survey?")) return;
    await fetch(`/api/admin/surveys/${id}`, { method: "DELETE" });
    fetchSurveys();
  }

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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b", margin: 0 }}>📝 Surveys</h1>
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Create and manage student surveys</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{
            padding: "10px 18px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg,#4F8CFF,#667eea)",
            color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 4px 12px rgba(79,140,255,0.3)",
          }}>
            ➕ New Survey
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div style={{ background: "white", borderRadius: 20, padding: 24, marginBottom: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", animation: "fadeSlideUp 0.3s ease" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Create New Survey</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Survey Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. System Usability Evaluation"
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Description (optional)</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of the survey..."
                  rows={2}
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box" }} />
              </div>
            </div>

            {/* Questions */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>QUESTIONS ({questions.length})</label>
                <button onClick={() => setQuestions([...questions, { question: "", category: "General", order: questions.length }])}
                  style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, border: "1.5px solid #4F8CFF", background: "white", color: "#4F8CFF", cursor: "pointer", fontWeight: 600 }}>
                  + Add Question
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
                {questions.map((q, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "#F8FAFF", borderRadius: 10, padding: "10px 12px" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#4F8CFF", minWidth: 20, paddingTop: 2 }}>{i + 1}.</span>
                    <div style={{ flex: 1, display: "flex", gap: 8 }}>
                      <input value={q.question}
                        onChange={e => { const updated = [...questions]; updated[i].question = e.target.value; setQuestions(updated); }}
                        placeholder="Enter question..."
                        style={{ flex: 2, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "6px 10px", fontSize: 12, outline: "none" }} />
                      <input value={q.category}
                        onChange={e => { const updated = [...questions]; updated[i].category = e.target.value; setQuestions(updated); }}
                        placeholder="Category"
                        style={{ flex: 1, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "6px 10px", fontSize: 12, outline: "none" }} />
                    </div>
                    <button onClick={() => setQuestions(questions.filter((_, j) => j !== i))}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16, paddingTop: 2 }}>✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={createSurvey} disabled={!form.title || creating}
                style={{ flex: 2, padding: "10px", borderRadius: 12, border: "none", background: form.title ? "linear-gradient(135deg,#4F8CFF,#667eea)" : "#e2e8f0", color: form.title ? "white" : "#94a3b8", fontWeight: 700, fontSize: 13, cursor: form.title ? "pointer" : "not-allowed" }}>
                {creating ? "Creating..." : "✅ Create Survey"}
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ flex: 1, padding: "10px", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "white", color: "#64748b", fontSize: 13, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Surveys list */}
        {surveys.length === 0 ? (
          <div style={{ background: "white", borderRadius: 20, padding: 60, textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <p style={{ fontSize: 40, margin: "0 0 12px" }}>📝</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: "0 0 6px" }}>No surveys yet</p>
            <p style={{ fontSize: 13, color: "#94a3b8" }}>Create your first survey to collect student feedback</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {surveys.map((survey, i) => (
              <div key={survey.id} style={{
                background: "white", borderRadius: 16, padding: "18px 20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                animation: `fadeSlideUp 0.4s ease ${i*0.05}s both`,
                border: `1.5px solid ${survey.isActive ? "#bfdbfe" : "#f1f5f9"}`,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: 0 }}>{survey.title}</p>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: survey.isActive ? "#dcfce7" : "#f1f5f9", color: survey.isActive ? "#16a34a" : "#94a3b8" }}>
                        {survey.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {survey.description && <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 8px" }}>{survey.description}</p>}
                    <div style={{ display: "flex", gap: 16 }}>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>📋 {survey._count?.questions || 0} questions</span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>💬 {survey._count?.responses || 0} responses</span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        {new Date(survey.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => toggleSurvey(survey.id, survey.isActive)} style={{
                      padding: "7px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                      background: survey.isActive ? "#fef9c3" : "#dcfce7",
                      color: survey.isActive ? "#ca8a04" : "#16a34a",
                      fontSize: 11, fontWeight: 700,
                    }}>
                      {survey.isActive ? "⏸ Deactivate" : "▶ Activate"}
                    </button>
                    <button onClick={() => deleteSurvey(survey.id)} style={{
                      padding: "7px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                      background: "#fee2e2", color: "#dc2626", fontSize: 11, fontWeight: 700,
                    }}>
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}