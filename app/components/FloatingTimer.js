"use client";

import { useState, useRef, useEffect } from "react";
import { useTimer } from "../context/TimerContext";

export default function FloatingTimer() {
  const { minutes, seconds, isRunning, setIsRunning, mode, switchMode, reset, sessions, modes } = useTimer();
  const [expanded, setExpanded] = useState(false);
  const [pos, setPos] = useState({ x: null, y: null });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const buttonRef = useRef(null);

  // Set default position bottom right
  useEffect(() => {
    setPos({
      x: window.innerWidth - 100,
      y: window.innerHeight - 100,
    });
  }, []);

  function onMouseDown(e) {
    if (e.target.closest("button:not(.drag-handle)")) return;
    setDragging(true);
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
    e.preventDefault();
  }

  useEffect(() => {
    function onMouseMove(e) {
      if (!dragging) return;
      setPos({
        x: Math.min(Math.max(e.clientX - dragOffset.current.x, 0), window.innerWidth - 80),
        y: Math.min(Math.max(e.clientY - dragOffset.current.y, 0), window.innerHeight - 80),
      });
    }
    function onMouseUp() {
      setDragging(false);
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging]);

  const total = modes[mode].minutes * 60;
  const remaining = minutes * 60 + seconds;
  const progress = ((total - remaining) / total) * 100;
  const circumference = 2 * Math.PI * 36;

  const modeColor = mode === "study" ? "#4F8CFF" : mode === "short" ? "#22c55e" : "#a855f7";
  const modeGradient = mode === "study"
    ? "linear-gradient(135deg, #4F8CFF, #667eea)"
    : mode === "short"
    ? "linear-gradient(135deg, #22c55e, #16a34a)"
    : "linear-gradient(135deg, #a855f7, #7c3aed)";

  if (!pos.x) return null;

  return (
    <div
      ref={buttonRef}
      className="fixed z-50"
      style={{ left: pos.x, top: pos.y, cursor: dragging ? "grabbing" : "grab" }}
      onMouseDown={onMouseDown}
    >
      {/* Expanded panel */}
      {expanded && (
        <div className="absolute bottom-24 right-0 bg-white rounded-2xl shadow-2xl p-5 w-72"
          style={{ animation: "fadeSlideUp 0.3s ease forwards" }}>

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">⏱️ Study Timer</h3>
            <button onClick={() => setExpanded(false)}
              className="drag-handle text-slate-400 hover:text-slate-600 text-lg">✕</button>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-1 mb-4 bg-slate-50 p-1 rounded-xl">
            {Object.entries(modes).map(([key, val]) => (
              <button key={key} onClick={() => switchMode(key)}
                className="drag-handle flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={mode === key ? {
                  background: modeGradient,
                  color: "white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                } : { color: "#64748b" }}>
                {key === "study" ? "🍅 Study" : key === "short" ? "☕ Short" : "😴 Long"}
              </button>
            ))}
          </div>

          {/* Timer circle */}
          <div className="flex flex-col items-center py-2">
            <div className="relative w-32 h-32 mb-3">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#EBF1FF" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none"
                  stroke={modeColor}
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 42}
                  strokeDashoffset={2 * Math.PI * 42 * (1 - progress / 100)}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.5s ease" }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-800">
                  {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </span>
                <span className="text-xs text-slate-400">{modes[mode].label}</span>
              </div>
            </div>

            <div className="flex gap-2 w-full">
              <button onClick={reset}
                className="drag-handle flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors">
                Reset
              </button>
              <button onClick={() => setIsRunning(!isRunning)}
                className="drag-handle flex-1 py-2 rounded-xl text-white text-sm font-medium transition-all"
                style={{
                  background: modeGradient,
                  boxShadow: isRunning ? `0 4px 15px ${modeColor}44` : ""
                }}>
                {isRunning ? "⏸ Pause" : "▶ Start"}
              </button>
            </div>
          </div>

          {/* Sessions dots */}
          <div className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full transition-all ${
                i < sessions % 4 ? "scale-110" : "bg-slate-100"
              }`}
              style={i < sessions % 4 ? { background: modeGradient } : {}} />
            ))}
            <span className="text-xs text-slate-400 ml-1">{sessions} sessions</span>
          </div>
        </div>
      )}

      {/* Main floating button */}
      <button
        className="drag-handle relative w-20 h-20 rounded-full text-white shadow-2xl flex items-center justify-center"
        onClick={() => setExpanded(!expanded)}
        style={{
          background: modeGradient,
          boxShadow: isRunning
            ? `0 0 30px ${modeColor}66, 0 8px 25px rgba(0,0,0,0.2)`
            : "0 8px 25px rgba(0,0,0,0.2)",
        }}>

        {/* Progress ring */}
        <svg className="absolute inset-0 w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
          <circle cx="40" cy="40" r="36" fill="none"
            stroke="white"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (circumference * progress) / 100}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease" }} />
        </svg>

        {/* Time display */}
        <div className="flex flex-col items-center relative z-10">
          <span className="text-sm font-bold leading-tight">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
          <span className="text-xs opacity-80">
            {mode === "study" ? "🍅" : mode === "short" ? "☕" : "😴"}
          </span>
        </div>

        {/* Pulsing ring when running */}
        {isRunning && (
          <div className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ background: modeGradient }} />
        )}

        {/* Green dot indicator */}
        {isRunning && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>
    </div>
  );
}