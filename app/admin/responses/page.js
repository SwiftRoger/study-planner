"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminResponsesPage() {
  const router = useRouter();
  const [surveys, setSurveys]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [loadingResp, setLoadingResp] = useState(false);

  useEffect(() => {
    fetch("/api/admin/surveys").then(r => {
      if (r.status === 401) { router.push("/login"); return null; }
      return r.json();
    }).then(d => { if (d) { setSurveys(d); setLoading(false); } });
  }, [router]);

  async function loadResponses(survey) {
    setSelected(survey);
    setLoadingResp(true);
    const r = await fetch(`/api/admin/responses?surveyId=${survey.id}`);
    const d = await r.json();
    setResponses(d);
    setLoadingResp(false);
  }

  // Calculate mean scores per question
  function calcStats(responses, questions) {
    if (!responses.length || !questions.length) return [];
    return questions.map(q => {
      const scores = responses.map(r => {
        try { const a = JSON.parse(r.answers); return a[q.id] || 0; } catch { return 0; }
      }).filter(s => s > 0);
      const mean = scores.length ? (scores.reduce((a,b) => a+b, 0) / scores.length) : 0;
      return { ...q, mean: mean.toFixed(2), count: scores.length };
    });
  }

  function interpretation(mean) {
    const m = parseFloat(mean);
    if (m >= 4.21) return { label: "Very High", color: "#16a34a" };
    if (m >= 3.41) return { label: "High",      color: "#4F8CFF" };
    if (m >= 2.61) return { label: "Moderate",  color: "#ca8a04" };
    if (m >= 1.81) return { label: "Low",       color: "#f97316" };
    return             { label: "Very Low",  color: "#dc2626" };
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
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b", margin: 0 }}>📋 Survey Responses</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>View and analyze student feedback</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
          {/* Survey list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>SELECT SURVEY</p>
            {surveys.map(s => (
              <button key={s.id} onClick={() => loadResponses(s)} style={{
                padding: "12px 14px", borderRadius: 12, border: "none", cursor: "pointer", textAlign: "left",
                background: selected?.id === s.id ? "#EBF1FF" : "white",
                borderLeft: selected?.id === s.id ? "3px solid #4F8CFF" : "3px solid transparent",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)", transition: "all 0.15s",
              }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: selected?.id === s.id ? "#4F8CFF" : "#1e293b", margin: "0 0 4px" }}>{s.title}</p>
                <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{s._count?.responses || 0} responses</p>
              </button>
            ))}
          </div>

          {/* Results */}
          <div>
            {!selected ? (
              <div style={{ background: "white", borderRadius: 20, padding: 40, textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <p style={{ fontSize: 32, margin: "0 0 10px" }}>👈</p>
                <p style={{ color: "#94a3b8", fontSize: 14 }}>Select a survey to view results</p>
              </div>
            ) : loadingResp ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                <div style={{ width: 28, height: 28, border: "3px solid #4F8CFF", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              </div>
            ) : responses.length === 0 ? (
              <div style={{ background: "white", borderRadius: 20, padding: 40, textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <p style={{ fontSize: 32, margin: "0 0 10px" }}>📭</p>
                <p style={{ color: "#94a3b8", fontSize: 14 }}>No responses yet for this survey</p>
              </div>
            ) : (
              <div>
                {/* Summary */}
                <div style={{ background: "white", borderRadius: 16, padding: 20, marginBottom: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: 0 }}>{selected.title}</h2>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#4F8CFF" }}>{responses.length} responses</span>
                  </div>
                </div>

                {/* Mean scores per question */}
                <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 14 }}>QUESTION ANALYSIS (5-Point Likert Scale)</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {calcStats(responses, selected.questions || []).map((q, i) => {
                      const interp = interpretation(q.mean);
                      return (
                        <div key={q.id} style={{ padding: "12px 14px", background: "#F8FAFF", borderRadius: 12, animation: `fadeSlideUp 0.4s ease ${i*0.04}s both` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                            <p style={{ fontSize: 12, color: "#475569", margin: 0, flex: 1 }}>
                              <strong>{i+1}.</strong> {q.question}
                            </p>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <p style={{ fontSize: 18, fontWeight: 800, color: interp.color, margin: 0 }}>{q.mean}</p>
                              <p style={{ fontSize: 10, color: interp.color, margin: 0, fontWeight: 600 }}>{interp.label}</p>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1, background: "#e2e8f0", borderRadius: 99, height: 6, overflow: "hidden" }}>
                              <div style={{ width: `${(parseFloat(q.mean) / 5) * 100}%`, height: "100%", background: interp.color, borderRadius: 99, transition: "width 1s ease" }} />
                            </div>
                            <span style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" }}>{q.count} answers · {q.category}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Overall mean */}
                  {responses.length > 0 && selected.questions?.length > 0 && (() => {
                    const stats = calcStats(responses, selected.questions);
                    const overall = (stats.reduce((s, q) => s + parseFloat(q.mean), 0) / stats.length).toFixed(2);
                    const interp  = interpretation(overall);
                    return (
                      <div style={{ marginTop: 16, padding: "14px 16px", background: "linear-gradient(135deg,#1e293b,#334155)", borderRadius: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: "0 0 2px" }}>Overall Mean Score</p>
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>Based on {responses.length} response{responses.length > 1 ? "s" : ""}</p>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <p style={{ fontSize: 28, fontWeight: 800, color: "#4F8CFF", margin: 0 }}>{overall}</p>
                            <p style={{ fontSize: 12, fontWeight: 700, color: interp.color, margin: 0 }}>{interp.label}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}