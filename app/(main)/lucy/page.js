"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "lucy_chat_history";

function LucyAvatar({ size = 36, pulse = false }) {
  return (
    <div className={pulse ? "animate-pulse" : ""} style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #4F8CFF 0%, #667eea 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.45, flexShrink: 0,
      boxShadow: "0 2px 12px rgba(79,140,255,0.35)",
    }}>🎓</div>
  );
}

// ── Action Confirmation Card ──────────────────────────────────
function ActionConfirmCard({ actions, language, onConfirm, onCancel }) {
  const [editedActions, setEditedActions] = useState(actions);

  function updateDate(index, newDate) {
    const updated = [...editedActions];
    updated[index] = { ...updated[index], newDeadline: newDate, newDeadlineDisplay: new Date(newDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) };
    setEditedActions(updated);
  }

  function removeAction(index) {
    setEditedActions(prev => prev.filter((_, i) => i !== index));
  }

  const actionColors = {
    complete:   { bg: "#dcfce7", color: "#16a34a", border: "#86efac" },
    reschedule: { bg: "#ede9fe", color: "#7c3aed", border: "#c4b5fd" },
    delete:     { bg: "#fee2e2", color: "#dc2626", border: "#fca5a5" },
    add:        { bg: "#dbeafe", color: "#1d4ed8", border: "#93c5fd" },
  };

  return (
    <div style={{
      background: "white", borderRadius: 16, padding: 16, marginBottom: 16,
      boxShadow: "0 4px 20px rgba(79,140,255,0.15)",
      border: "1.5px solid #e0e7ff",
      animation: "fadeSlideUp 0.3s ease forwards",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>🎓</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#4F8CFF" }}>
          {language === "kh" ? `Lucy ចង់ធ្វើការផ្លាស់ប្តូរ ${editedActions.length} ។` : `Lucy wants to make ${editedActions.length} change${editedActions.length > 1 ? "s" : ""}:`}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {editedActions.map((action, i) => {
          const c = actionColors[action.type] || actionColors.reschedule;
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: c.bg, borderRadius: 10, padding: "10px 12px",
              border: `1px solid ${c.border}`,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{action.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: c.color, margin: 0 }}>
                  {action.type === "complete" && `Mark "${action.title}" as completed`}
                  {action.type === "delete" && `Delete "${action.title}"`}
                  {action.type === "add" && `Add "${action.title}" (${action.subject})`}
                  {action.type === "reschedule" && (
                    <>
                      Reschedule <strong>"{action.title}"</strong> →{" "}
                      <input
                        type="date"
                        value={action.newDeadline ? action.newDeadline.slice(0, 10) : ""}
                        onChange={e => updateDate(i, new Date(e.target.value).toISOString())}
                        style={{
                          border: `1px solid ${c.border}`, borderRadius: 6,
                          padding: "1px 6px", fontSize: 12, color: c.color,
                          background: "white", cursor: "pointer",
                        }}
                      />
                    </>
                  )}
                </p>
                {action.subject && action.type !== "reschedule" && (
                  <p style={{ fontSize: 11, color: c.color, opacity: 0.7, margin: "2px 0 0" }}>📖 {action.subject}</p>
                )}
              </div>
              <button onClick={() => removeAction(i)} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 12, color: c.color, opacity: 0.6, flexShrink: 0,
              }}>✕</button>
            </div>
          );
        })}
      </div>

      {editedActions.length === 0 ? (
        <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginBottom: 12 }}>
          All actions removed
        </p>
      ) : null}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => editedActions.length > 0 && onConfirm(editedActions)}
          disabled={editedActions.length === 0}
          style={{
            flex: 2, padding: "10px", borderRadius: 12, border: "none",
            background: editedActions.length === 0 ? "#e2e8f0" : "linear-gradient(135deg, #4F8CFF, #667eea)",
            color: editedActions.length === 0 ? "#94a3b8" : "white",
            fontWeight: 700, fontSize: 13, cursor: editedActions.length === 0 ? "not-allowed" : "pointer",
            boxShadow: editedActions.length === 0 ? "none" : "0 4px 12px rgba(79,140,255,0.3)",
          }}
        >
          ✅ {language === "kh" ? "បញ្ជាក់ទាំងអស់" : "Confirm All"}
        </button>
        <button onClick={onCancel} style={{
          flex: 1, padding: "10px", borderRadius: 12,
          border: "1.5px solid #e2e8f0", background: "white",
          color: "#94a3b8", fontWeight: 600, fontSize: 13, cursor: "pointer",
        }}>
          ❌ {language === "kh" ? "បោះបង់" : "Cancel"}
        </button>
      </div>
    </div>
  );
}

// ── Task Confirm Card ─────────────────────────────────────────
function TaskConfirmCard({ task, onConfirm, onCancel, language }) {
  const [priority, setPriority] = useState(task.priority || "medium");
  const [title, setTitle] = useState(task.title || "");
  const [subject, setSubject] = useState(task.subject || "");
  const [editing, setEditing] = useState(false);

  const deadlineDisplay = (() => {
    try {
      const d = new Date(task.deadline);
      if (isNaN(d)) return task.deadline;
      return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    } catch { return task.deadline; }
  })();

  const priorityColors = {
    low:    { bg: "#dcfce7", color: "#16a34a", border: "#16a34a" },
    medium: { bg: "#fef9c3", color: "#ca8a04", border: "#ca8a04" },
    high:   { bg: "#fee2e2", color: "#dc2626", border: "#dc2626" },
  };

  return (
    <div style={{
      background: "white", borderRadius: 16, padding: 16, marginBottom: 16,
      boxShadow: "0 4px 20px rgba(79,140,255,0.15)",
      border: "1.5px solid #e0e7ff",
      animation: "fadeSlideUp 0.3s ease forwards",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>📚</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#4F8CFF" }}>
          {language === "kh" ? "Lucy ចង់បន្ថែមកិច្ចការ" : "Lucy wants to add this task"}
        </span>
        <button onClick={() => setEditing(!editing)} style={{
          marginLeft: "auto", fontSize: 11, padding: "3px 10px", borderRadius: 8,
          border: "1px solid #e2e8f0", background: editing ? "#EBF1FF" : "white",
          color: editing ? "#4F8CFF" : "#94a3b8", cursor: "pointer", fontWeight: 600,
        }}>
          ✏️ {editing ? (language === "kh" ? "រួចរាល់" : "Done") : (language === "kh" ? "កែប្រែ" : "Edit")}
        </button>
      </div>

      <div style={{ background: "#F8FAFF", borderRadius: 12, padding: 12, marginBottom: 12 }}>
        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div>
              <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>TITLE</label>
              <input value={title} onChange={e => setTitle(e.target.value)} style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "6px 10px", fontSize: 13, marginTop: 2, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>SUBJECT</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "6px 10px", fontSize: 13, marginTop: 2, outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{title}</p>
            <p style={{ fontSize: 12, color: "#64748b", marginBottom: 2 }}>📖 Subject: <strong>{subject}</strong></p>
            <p style={{ fontSize: 12, color: "#64748b" }}>📅 Deadline: <strong>{deadlineDisplay}</strong></p>
          </>
        )}
      </div>

      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 6 }}>PRIORITY</p>
        <div style={{ display: "flex", gap: 8 }}>
          {["low","medium","high"].map(p => {
            const c = priorityColors[p];
            return (
              <button key={p} onClick={() => setPriority(p)} style={{
                flex: 1, padding: "8px 4px", borderRadius: 10, cursor: "pointer",
                border: priority === p ? `2px solid ${c.border}` : "2px solid #e2e8f0",
                background: priority === p ? c.bg : "white",
                color: priority === p ? c.color : "#94a3b8",
                fontWeight: priority === p ? 700 : 500, fontSize: 12, transition: "all 0.15s",
              }}>
                {p === "low" ? "🟢" : p === "medium" ? "🟡" : "🔴"} {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => onConfirm({ ...task, title, subject, priority })} style={{
          flex: 2, padding: "10px", borderRadius: 12, border: "none",
          background: "linear-gradient(135deg, #4F8CFF, #667eea)",
          color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer",
          boxShadow: "0 4px 12px rgba(79,140,255,0.3)",
        }}>✅ {language === "kh" ? "បន្ថែមកិច្ចការ" : "Add Task"}</button>
        <button onClick={onCancel} style={{
          flex: 1, padding: "10px", borderRadius: 12,
          border: "1.5px solid #e2e8f0", background: "white",
          color: "#94a3b8", fontWeight: 600, fontSize: 13, cursor: "pointer",
        }}>❌ {language === "kh" ? "បោះបង់" : "Cancel"}</button>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────
function Toast({ msg, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 100,
      background: msg.bg || "linear-gradient(135deg, #4F8CFF, #667eea)",
      color: "white", borderRadius: 16, padding: "14px 18px",
      boxShadow: "0 8px 32px rgba(79,140,255,0.4)", maxWidth: 300,
      animation: "slideUp 0.3s ease",
    }}>
      <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{msg.title}</p>
      <p style={{ fontSize: 12, opacity: 0.9 }}>{msg.body}</p>
      <button onClick={onClose} style={{ position: "absolute", top: 8, right: 10, background: "none", border: "none", color: "white", cursor: "pointer", fontSize: 14, opacity: 0.7 }}>✕</button>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "10px 14px" }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#4F8CFF", animation: "bounce 1.2s ease infinite", animationDelay: `${i*0.2}s` }} />
      ))}
    </div>
  );
}

function MessageBubble({ msg, isLatest }) {
  const isLucy = msg.role === "assistant";
  return (
    <div style={{ display: "flex", flexDirection: isLucy ? "row" : "row-reverse", alignItems: "flex-end", gap: 10, marginBottom: 16, animation: isLatest ? "fadeSlideUp 0.35s ease forwards" : "none" }}>
      {isLucy && <LucyAvatar size={34} />}
      <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isLucy ? "flex-start" : "flex-end" }}>
        {isLucy && <span style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4, fontWeight: 600 }}>Lucy</span>}
        <div style={{
          padding: "12px 16px",
          borderRadius: isLucy ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
          background: isLucy ? "white" : "linear-gradient(135deg, #4F8CFF 0%, #667eea 100%)",
          color: isLucy ? "#1e293b" : "white",
          fontSize: 14, lineHeight: 1.6,
          boxShadow: isLucy ? "0 2px 12px rgba(0,0,0,0.06)" : "0 4px 16px rgba(79,140,255,0.3)",
          whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}>{msg.content}</div>
        <span style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>{msg.time || ""}</span>
      </div>
    </div>
  );
}

const QUICK_EN = ["What tasks do I have this week?","I have an exam coming up, help me plan","What should I study today?","I'm feeling overwhelmed with my tasks"];
const QUICK_KH = ["តើខ្ញុំមានកិច្ចការអ្វីខ្លះអាទិត្យនេះ?","ខ្ញុំមានប្រឡង សូមជួយរៀបចំផែនការ","ថ្ងៃនេះខ្ញុំគួរសិក្សាអ្វី?","ខ្ញុំមានអារម្មណ៍ភ័យខ្លាចកិច្ចការច្រើន"];

function detectKhmerText(text) { return /[\u1780-\u17FF]/.test(text); }
function now() { return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }); }

export default function LucyPage() {
  const router = useRouter();
  const [messages, setMessages] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("en");
  const [toast, setToast] = useState(null);
  const [userName, setUserName] = useState("there");
  const [pendingTask, setPendingTask] = useState(null);
  const [pendingActions, setPendingActions] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const savedLang = localStorage.getItem("lucyLanguage") || "en";
    setLanguage(savedLang);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) { setMessages(parsed); return; }
      }
    } catch {}
    fetch("/api/me").then(r => r.json()).then(d => {
      const name = d.user ? d.user.name.split(" ")[0] : "there";
      setUserName(name);
      const lang = localStorage.getItem("lucyLanguage") || "en";
      const greet = lang === "kh"
        ? `សួស្តី! ខ្ញុំឈ្មោះ Lucy 🎓\nខ្ញុំជាជំនួយការសិក្សា AI របស់អ្នក។\nតើខ្ញុំអាចជួយអ្នកបានដោយរបៀបណាថ្ងៃនេះ?`
        : `Hi ${name}! I'm Lucy 🎓\nI'm your AI study companion. Tell me about assignments, exams, or tasks and I'll help you stay on track.\nWhat's on your plate today?`;
      const initial = [{ role: "assistant", content: greet, time: now() }];
      setMessages(initial);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    });
  }, []);

  useEffect(() => { fetch("/api/me").then(r => r.json()).then(d => { if (d.user) setUserName(d.user.name.split(" ")[0]); }); }, []);
  useEffect(() => { if (messages && messages.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50))); }, [messages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading, pendingTask, pendingActions]);

  function toggleLanguage() {
    const next = language === "en" ? "kh" : "en";
    setLanguage(next);
    localStorage.setItem("lucyLanguage", next);
    setMessages(prev => [...(prev || []), { role: "assistant", content: next === "kh" ? "បានប្តូរទៅភាសាខ្មែរ! 🇰🇭" : "Switched to English! 🇺🇸", time: now() }]);
  }

  function clearChat() {
    localStorage.removeItem(STORAGE_KEY);
    setPendingTask(null); setPendingActions(null);
    const lang = localStorage.getItem("lucyLanguage") || "en";
    const greet = lang === "kh" ? `សួស្តី! Lucy នៅទីនេះ 🎓` : `Hi ${userName}! I'm Lucy 🎓\nWhat's on your plate today?`;
    const initial = [{ role: "assistant", content: greet, time: now() }];
    setMessages(initial);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  }

  // ── Confirm task add ──────────────────────────────────────
  async function confirmTask(taskData) {
    setPendingTask(null);
    try {
      const res = await fetch("/api/lucy/confirm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      const data = await res.json();
      if (data.task) {
        setToast({ title: "✅ Task saved!", body: `"${data.task.title}" added to your tasks.`, bg: "linear-gradient(135deg, #4F8CFF, #667eea)" });
        setMessages(prev => [...(prev || []), { role: "assistant", content: language === "kh" ? `បានរក្សាទុក "${data.task.title}" ។ 📋` : `Got it! "${data.task.title}" has been added to your tasks. 📋`, time: now() }]);
      }
    } catch { setToast({ title: "❌ Error", body: "Couldn't save task. Try again.", bg: "linear-gradient(135deg,#ef4444,#dc2626)" }); }
  }

  // ── Confirm multiple actions ──────────────────────────────
  async function confirmActions(actions) {
    setPendingActions(null);
    try {
      const res = await fetch("/api/lucy/actions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actions }),
      });
      const data = await res.json();
      const successCount = data.successCount || 0;
      const completed = actions.filter(a => a.type === "complete").length;
      const rescheduled = actions.filter(a => a.type === "reschedule").length;
      const deleted = actions.filter(a => a.type === "delete").length;
      const added = actions.filter(a => a.type === "add").length;

      const summary = [
        completed > 0 && `${completed} completed`,
        rescheduled > 0 && `${rescheduled} rescheduled`,
        deleted > 0 && `${deleted} deleted`,
        added > 0 && `${added} added`,
      ].filter(Boolean).join(", ");

      setToast({ title: `✅ ${successCount} action${successCount > 1 ? "s" : ""} done!`, body: summary, bg: "linear-gradient(135deg, #22c55e, #16a34a)" });
      setMessages(prev => [...(prev || []), {
        role: "assistant",
        content: language === "kh"
          ? `ការផ្លាស់ប្តូរ ${successCount} ត្រូវបានអនុវត្ត! 🎉`
          : `Done! ${successCount} change${successCount > 1 ? "s" : ""} applied successfully. Head to your Tasks tab to see the updates! 🎉`,
        time: now(),
      }]);
    } catch {
      setToast({ title: "❌ Error", body: "Some actions failed. Try again.", bg: "linear-gradient(135deg,#ef4444,#dc2626)" });
    }
  }

  function cancelActions() {
    setPendingActions(null);
    setMessages(prev => [...(prev || []), { role: "assistant", content: language === "kh" ? "យល់ព្រម! បានលុបចោល។" : "No problem! Changes cancelled.", time: now() }]);
  }

  // ── Send message ──────────────────────────────────────────
  async function sendMessage(text) {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput("");
    const userMsg = { role: "user", content, time: now() };
    const updatedMessages = [...(messages || []), userMsg];
    setMessages(updatedMessages);
    setLoading(true);
    try {
      const effectiveLang = detectKhmerText(content) ? "kh" : language;
      const res = await fetch("/api/lucy", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "chat", messages: updatedMessages.map(({ role, content }) => ({ role, content })), language: effectiveLang }),
      });
      if (res.status === 401) { router.push("/login"); return; }
      const data = await res.json();
      setMessages(prev => [...(prev || []), { role: "assistant", content: data.reply || "Sorry, try again!", time: now() }]);
      if (data.pendingTask) setPendingTask(data.pendingTask);
      if (data.pendingActions && data.pendingActions.length > 0) setPendingActions(data.pendingActions);
    } catch {
      setMessages(prev => [...(prev || []), { role: "assistant", content: "Oops, something went wrong. Try again! 😅", time: now() }]);
    } finally { setLoading(false); inputRef.current?.focus(); }
  }

  function handleKeyDown(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }

  if (messages === null) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ width: 32, height: 32, border: "3px solid #4F8CFF", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .lucy-input:focus{outline:none}
        .quick-btn:hover{background:#EBF1FF !important;color:#4F8CFF !important;border-color:#4F8CFF !important}
        .send-btn:hover{opacity:0.85}.send-btn:disabled{opacity:0.5;cursor:not-allowed}
      `}</style>
      <div style={{ maxWidth: 800, margin: "0 auto", height: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ background: "white", borderRadius: 20, padding: "16px 20px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <LucyAvatar size={44} />
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 }}>Lucy</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
                <span style={{ fontSize: 12, color: "#64748b" }}>{language === "kh" ? "ជំនួយការសិក្សា AI" : "AI Study Companion · Online"}</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={clearChat} style={{ padding: "8px 12px", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 12, color: "#94a3b8" }}>🗑️ Clear</button>
            <button onClick={toggleLanguage} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#475569" }}>
              <span>{language === "en" ? "🇺🇸" : "🇰🇭"}</span>
              <span>{language === "en" ? "EN" : "KH"}</span>
              <span style={{ opacity: 0.4, fontSize: 11 }}>/ {language === "en" ? "KH" : "EN"}</span>
            </button>
          </div>
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, overflowY: "auto", background: "#F0F4FF", borderRadius: 20, padding: "20px 16px", marginBottom: 12 }}>
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} isLatest={i === messages.length - 1 && !pendingTask && !pendingActions} />
          ))}
          {loading && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 16 }}>
              <LucyAvatar size={34} pulse />
              <div style={{ background: "white", borderRadius: "4px 18px 18px 18px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}><TypingDots /></div>
            </div>
          )}
          {/* Action confirmation card */}
          {pendingActions && pendingActions.length > 0 && (
            <ActionConfirmCard actions={pendingActions} language={language} onConfirm={confirmActions} onCancel={cancelActions} />
          )}
          {/* New task confirmation card */}
          {pendingTask && !pendingActions && (
            <TaskConfirmCard task={pendingTask} language={language} onConfirm={confirmTask} onCancel={() => { setPendingTask(null); setMessages(prev => [...(prev||[]), { role: "assistant", content: language === "kh" ? "យល់ព្រម! បានលុបចោល។" : "No problem! Task cancelled.", time: now() }]); }} />
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        {messages.length <= 2 && !pendingTask && !pendingActions && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            {(language === "kh" ? QUICK_KH : QUICK_EN).map((p, i) => (
              <button key={i} onClick={() => sendMessage(p)} className="quick-btn" style={{ padding: "7px 14px", borderRadius: 20, border: "1.5px solid #e2e8f0", background: "white", fontSize: 12, color: "#475569", cursor: "pointer", fontWeight: 500 }}>{p}</button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div style={{ background: "white", borderRadius: 20, padding: "12px 16px", display: "flex", alignItems: "flex-end", gap: 10, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1.5px solid #e2e8f0" }}>
          <textarea ref={inputRef} className="lucy-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={language === "kh" ? "សរសេរសាររបស់អ្នកទៅ Lucy... (Enter ដើម្បីផ្ញើ)" : "Tell Lucy about your tasks, exams, or ask anything... (Enter to send)"}
            rows={1} style={{ flex: 1, border: "none", resize: "none", fontSize: 14, color: "#1e293b", lineHeight: 1.5, background: "transparent", maxHeight: 120, overflowY: "auto" }}
            onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
          />
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading} className="send-btn" style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #4F8CFF, #667eea)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(79,140,255,0.3)" }}>
            {loading
              ? <div style={{ width: 16, height: 16, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            }
          </button>
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", marginTop: 8 }}>
          {language === "kh" ? "Lucy នឹងស្នើសុំការបញ្ជាក់ មុននឹងផ្លាស់ប្តូរកិច្ចការ" : "Lucy will ask for confirmation before making any changes"}
        </p>
      </div>
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </>
  );
}