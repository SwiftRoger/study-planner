"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/admin/dashboard",  label: "Dashboard",    icon: "📊" },
  { href: "/admin/students",   label: "Students",     icon: "👥" },
  { href: "/admin/surveys",    label: "Surveys",      icon: "📝" },
  { href: "/admin/responses",  label: "Responses",    icon: "📋" },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [admin, setAdmin] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(d => {
      if (!d.user) { router.push("/login"); return; }
      setAdmin(d.user);
    });
  }, [router]);

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F0F4FF" }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 20 }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 240, background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
        display: "flex", flexDirection: "column", position: "fixed", height: "100%",
        zIndex: 30, transition: "transform 0.3s ease",
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
      }}
        className="md:translate-x-0"
      >
        {/* Logo */}
        <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#4F8CFF,#667eea)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚙️</div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: "white", margin: 0 }}>Admin Panel</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", margin: 0 }}>Study Planner System</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
          {navItems.map(item => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 12, marginBottom: 4,
                textDecoration: "none", fontSize: 13, fontWeight: 600,
                background: active ? "rgba(79,140,255,0.2)" : "transparent",
                color: active ? "#4F8CFF" : "rgba(255,255,255,0.6)",
                borderLeft: active ? "3px solid #4F8CFF" : "3px solid transparent",
                transition: "all 0.15s",
              }}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Admin info + logout */}
        <div style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#4F8CFF,#667eea)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "white" }}>
              {admin?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "white", margin: 0 }}>{admin?.name || "Admin"}</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>Administrator</p>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            width: "100%", padding: "8px", borderRadius: 10, border: "none",
            background: "rgba(239,68,68,0.15)", color: "#ef4444",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, marginLeft: 0, display: "flex", flexDirection: "column" }} className="md:ml-60">
        {/* Mobile topbar */}
        <div style={{ background: "white", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }} className="md:hidden">
          <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>☰</button>
          <p style={{ fontWeight: 800, color: "#1e293b", margin: 0 }}>Admin Panel</p>
          <div />
        </div>
        <main style={{ flex: 1, padding: "24px 20px", maxWidth: 1100, width: "100%", margin: "0 auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}