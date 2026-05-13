"use client";

import { useState, useEffect, useRef } from "react";

export default function AICompanion() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "សួស្តី! 👋 I'm your AI Study Companion! I can help you with study tips, explain topics, or suggest a study plan. Ask me anything in English or Khmer!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [pos, setPos] = useState({ x: 24, y: 500 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const bottomRef = useRef(null);

  useEffect(() => {
    setPos({ x: window.innerWidth - 100, y: window.innerHeight - 200 });
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((data) => setTasks(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function onMouseDown(e) {
    setDragging(true);
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
  }

  useEffect(() => {
    function onMouseMove(e) {
      if (!dragging) return;
      setPos({
        x: Math.min(Math.max(e.clientX - dragOffset.current.x, 0), window.innerWidth - 56),
        y: Math.min(Math.max(e.clientY - dragOffset.current.y, 0), window.innerHeight - 56),
      });
    }
    function onMouseUp() { setDragging(false); }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const taskContext = tasks.length > 0
      ? `Student's current tasks: ${tasks.map(t => `${t.title} (${t.subject}, ${t.priority} priority, due ${new Date(t.deadline).toLocaleDateString()}, status: ${t.status})`).join(", ")}`
      : "Student has no tasks yet.";

    const res = await fetch("/api/companion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [...messages, userMsg], taskContext }),
    });

    const data = await res.json();
    setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    setLoading(false);
  }

  const chatX = pos.x + 70 > (typeof window !== "undefined" ? window.innerWidth : 1200) - 320 ? pos.x - 320 : pos.x + 70;
  const chatY = pos.y - 450 < 0 ? pos.y + 70 : pos.y - 450;

  return (
    <>
      {/* Chat window */}
      {open && (
        <div className="fixed z-50 w-80 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ height: "450px", left: chatX, top: chatY, animation: "fadeSlideUp 0.3s ease forwards" }}>

          {/* Header */}
          <div className="p-4 flex items-center justify-between"
            style={{ background: "linear-gradient(135deg, #4F8CFF, #667eea)" }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-lg">🤖</span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">AI Study Companion</p>
                <p className="text-white/70 text-xs">Ask me anything!</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white text-lg">✕</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFF]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2 shrink-0 mt-1"
                    style={{ background: "linear-gradient(135deg, #4F8CFF, #667eea)" }}>
                    <span className="text-xs">🤖</span>
                  </div>
                )}
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                  msg.role === "user" ? "text-white rounded-tr-sm" : "bg-white text-slate-700 rounded-tl-sm shadow-sm"
                }`}
                  style={msg.role === "user" ? { background: "linear-gradient(135deg, #4F8CFF, #667eea)" } : {}}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2 shrink-0"
                  style={{ background: "linear-gradient(135deg, #4F8CFF, #667eea)" }}>
                  <span className="text-xs">🤖</span>
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-[#4F8CFF] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-[#4F8CFF] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-[#4F8CFF] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask in English or Khmer..."
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]"
            />
            <button onClick={sendMessage} disabled={loading}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #4F8CFF, #667eea)" }}>
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Draggable floating button */}
      <div
        className="fixed z-50"
        style={{ left: pos.x, top: pos.y, cursor: dragging ? "grabbing" : "grab" }}
        onMouseDown={onMouseDown}
      >
        <button
          onClick={() => !dragging && setOpen(!open)}
          className="w-16 h-16 rounded-full text-white shadow-2xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #667eea, #4F8CFF)",
            boxShadow: open
              ? "0 0 30px rgba(102,126,234,0.6), 0 8px 25px rgba(0,0,0,0.2)"
              : "0 8px 25px rgba(102,126,234,0.5)",
            animation: !open ? "pulse-slow 3s ease-in-out infinite" : "",
          }}>
          <span className="text-2xl">{open ? "✕" : "🤖"}</span>
        </button>
      </div>
    </>
  );
}