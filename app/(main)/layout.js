"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/tasks", label: "Tasks", icon: "📋" },
  { href: "/planner", label: "Study Planner", icon: "🤖" },
  { href: "/calendar", label: "Calendar", icon: "📅" },
  { href: "/progress", label: "Progress", icon: "📊" },
  { href: "/reminders", label: "Reminders", icon: "🔔" },
  { href: "/timer", label: "Study Timer", icon: "⏱️" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

function PageWrapper({ children }) {
  const pathname = usePathname();
  const [key, setKey] = useState(0);

useEffect(() => {
  setKey(k => k + 1);
}, [pathname]);

  return (
    <main
      key={key}
      className="flex-1 ml-64 p-6"
      style={{ animation: "fadeSlideUp 0.6s ease forwards" }}
    >
      {children}
    </main>
  );
}

export default function MainLayout({ children }) {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(d => { if (d.user) setUser(d.user); });
    const saved = localStorage.getItem("darkMode");
    if (saved === "true") { setDark(true); document.documentElement.classList.add("dark"); }
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("darkMode", next);
    if (next) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }


  return (
    <div className={`flex min-h-screen ${dark ? "bg-slate-900" : "bg-[#F0F4FF]"}`}>
      {/* Sidebar */}
      <aside className={`w-64 flex flex-col fixed h-full z-10 shadow-sm ${dark ? "bg-slate-800 border-r border-slate-700" : "bg-white"}`}>
        
        {/* Logo */}
        <div className={`p-6 border-b ${dark ? "border-slate-700" : "border-slate-100"}`}>
          <div className="flex items-center gap-2">
            <img src="/num-logo.png" alt="NUM Logo" className="w-10 h-10 object-contain" />
            <div>
              <p className={`font-bold text-sm ${dark ? "text-white" : "text-slate-800"}`}>Study Planner</p>
              <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-400"}`}>AI-Based System</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-[#4F8CFF] text-white shadow-sm"
                    : dark
                    ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                    : "text-slate-600 hover:bg-[#EBF1FF] hover:text-[#4F8CFF]"
                }`}>
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Dark mode toggle */}
        <div className={`px-4 py-3 border-t ${dark ? "border-slate-700" : "border-slate-100"}`}>
          <button onClick={toggleDark}
            className={`w-full flex items-center justify-between px-4 py-2 rounded-xl text-sm transition-all ${
              dark ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-[#F0F4FF] text-slate-600 hover:bg-[#EBF1FF]"
            }`}>
            <span>{dark ? "🌙 Dark Mode" : "☀️ Light Mode"}</span>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${dark ? "bg-[#4F8CFF]" : "bg-slate-300"}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${dark ? "left-5" : "left-0.5"}`} />
            </div>
          </button>
        </div>

        {/* User info */}
        <div className={`p-4 border-t ${dark ? "border-slate-700" : "border-slate-100"}`}>
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-[#4F8CFF] rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">
                {user ? user.name[0].toUpperCase() : "S"}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className={`text-sm font-medium truncate ${dark ? "text-white" : "text-slate-700"}`}>
                {user ? user.name : "Loading..."}
              </p>
              <p className={`text-xs truncate ${dark ? "text-slate-400" : "text-slate-400"}`}>
                {user ? user.email : ""}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <PageWrapper>{children}</PageWrapper>
    </div>
  );
}