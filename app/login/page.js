"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

useEffect(() => {
  setTimeout(() => setVisible(true), 50);
}, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
   if (!res.ok) { setError(data.message); return; }
if (data.role === "admin") {
  router.push("/admin/dashboard");
} else {
  router.push("/onboarding");
}
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #667eea 0%, #4F8CFF 40%, #a8edea 100%)" }}>

      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)", animation: "pulse 4s ease-in-out infinite" }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)", animation: "pulse 4s ease-in-out infinite 2s" }} />
      </div>

      <div className="w-full max-w-md relative"
  style={{
    opacity: visible ? 1 : 0,
    transform: visible ? "translateX(0)" : "translateX(-60px)",
    transition: "opacity 0.5s ease, transform 0.5s ease",
  }}>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 shadow-lg"
            style={{ transition: "transform 0.3s ease, box-shadow 0.3s ease" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = ""; }}>
            <img src="/num-logo.png" alt="NUM Logo" className="w-14 h-14 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white">AI-Based Study Planner</h1>
          <p className="text-white/70 text-sm mt-1">National University of Management</p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8"
          style={{ transition: "transform 0.3s ease, box-shadow 0.3s ease" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 30px 60px rgba(0,0,0,0.2)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 25px 50px rgba(0,0,0,0.15)"; }}>

          <h2 className="text-2xl font-bold text-slate-800">Welcome back 👋</h2>
          <p className="text-slate-400 text-sm mt-1">Sign in to continue your studies</p>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-100 text-red-500 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">Email</label>
              <input
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800  text-sm outline-none focus:ring-2 focus:ring-[#4F8CFF] focus:border-transparent bg-slate-50 focus:bg-white"
                style={{ transition: "all 0.2s ease" }}
                placeholder="Enter your email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">Password</label>
              <input
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm outline-none focus:ring-2 focus:ring-[#4F8CFF] focus:border-transparent bg-slate-50 focus:bg-white"
                style={{ transition: "all 0.2s ease" }}
                placeholder="Enter your password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white rounded-xl py-3 font-medium mt-2 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #4F8CFF 0%, #667eea 100%)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                boxShadow: "0 4px 15px rgba(79, 140, 255, 0.4)"
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 25px rgba(79, 140, 255, 0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 15px rgba(79, 140, 255, 0.4)"; }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-sm text-slate-400 mt-6 text-center">
            Don't have an account?{" "}
            <Link href="/register" className="text-[#4F8CFF] font-semibold hover:underline">
              Create account
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-white/60 mt-6">
          Group 13 · Faculty of Information Technology · NUM
        </p>
      </div>
    </main>
  );
}
