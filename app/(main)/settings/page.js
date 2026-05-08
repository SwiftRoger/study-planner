"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [studyPrefs, setStudyPrefs] = useState({
    hoursPerDay: 4,
    reminderDays: 3,
    preferMorning: true,
  });
  const [profileMsg, setProfileMsg] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [prefMsg, setPrefMsg] = useState("");

  useEffect(() => {
    // Load user info from token
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setProfile({ name: data.user.name, email: data.user.email });
      })
      .catch(() => {});

    // Load study prefs from localStorage
    const saved = localStorage.getItem("studyPrefs");
    if (saved) setStudyPrefs(JSON.parse(saved));
  }, []);

  function savePrefs() {
    localStorage.setItem("studyPrefs", JSON.stringify(studyPrefs));
    setPrefMsg("Preferences saved!");
    setTimeout(() => setPrefMsg(""), 2000);
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "study", label: "Study Preferences", icon: "📚" },
    { id: "about", label: "About", icon: "ℹ️" },
  ];

  return (
  <div className="max-w-2xl mx-auto relative">
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="animate-float absolute top-10 right-10 w-40 h-40 rounded-full opacity-5"
        style={{ background: "linear-gradient(135deg, #4F8CFF, #667eea)" }} />
      <div className="animate-pulse-slow absolute bottom-10 left-10 w-32 h-32 opacity-5"
        style={{ background: "radial-gradient(circle, #a8edea 0%, transparent 70%)" }} />
      <div className="animate-float-delayed absolute top-1/2 right-5 w-20 h-20 opacity-5"
        style={{ background: "linear-gradient(135deg, #667eea, #4F8CFF)", borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%" }} />
    </div>
    <div className="relative z-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-[#4F8CFF] text-white"
                : "bg-white text-slate-600 hover:bg-[#EBF1FF] hover:text-[#4F8CFF]"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Profile Information</h2>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-[#4F8CFF] rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {profile.name ? profile.name[0].toUpperCase() : "S"}
                </span>
              </div>
              <div>
                <p className="font-semibold text-slate-800">{profile.name || "Student"}</p>
                <p className="text-sm text-slate-500">{profile.email || "student@email.com"}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
                />
                <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
              </div>
              {profileMsg && <p className="text-green-500 text-sm">{profileMsg}</p>}
              <button
                onClick={() => { setProfileMsg("Profile updated!"); setTimeout(() => setProfileMsg(""), 2000); }}
                className="px-4 py-2 bg-[#4F8CFF] text-white rounded-xl text-sm hover:bg-[#3a7ae0] transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Change Password</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Current Password</label>
                <input
                  type="password"
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">New Password</label>
                <input
                  type="password"
                  value={passwords.newPass}
                  onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Confirm New Password</label>
                <input
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]"
                  placeholder="••••••••"
                />
              </div>
              {passwordMsg && <p className={`text-sm ${passwordMsg.includes("match") ? "text-red-500" : "text-green-500"}`}>{passwordMsg}</p>}
              <button
                onClick={() => {
                  if (passwords.newPass !== passwords.confirm) {
                    setPasswordMsg("Passwords do not match!");
                  } else {
                    setPasswordMsg("Password updated!");
                    setPasswords({ current: "", newPass: "", confirm: "" });
                  }
                  setTimeout(() => setPasswordMsg(""), 2000);
                }}
                className="px-4 py-2 bg-[#4F8CFF] text-white rounded-xl text-sm hover:bg-[#3a7ae0] transition-colors"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Study Preferences Tab */}
      {activeTab === "study" && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Study Preferences</h2>
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Default study hours per day: <span className="text-[#4F8CFF] font-bold">{studyPrefs.hoursPerDay} hours</span>
              </label>
              <input
                type="range"
                min="1"
                max="12"
                value={studyPrefs.hoursPerDay}
                onChange={(e) => setStudyPrefs({ ...studyPrefs, hoursPerDay: parseInt(e.target.value) })}
                className="w-full accent-[#4F8CFF]"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>1 hr</span><span>12 hrs</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Remind me when deadline is within: <span className="text-[#4F8CFF] font-bold">{studyPrefs.reminderDays} days</span>
              </label>
              <input
                type="range"
                min="1"
                max="7"
                value={studyPrefs.reminderDays}
                onChange={(e) => setStudyPrefs({ ...studyPrefs, reminderDays: parseInt(e.target.value) })}
                className="w-full accent-[#4F8CFF]"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>1 day</span><span>7 days</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#F0F4FF] rounded-xl">
              <div>
                <p className="text-sm font-medium text-slate-700">Prefer morning study sessions</p>
                <p className="text-xs text-slate-400 mt-0.5">Schedule tasks earlier in the day</p>
              </div>
              <button
                onClick={() => setStudyPrefs({ ...studyPrefs, preferMorning: !studyPrefs.preferMorning })}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  studyPrefs.preferMorning ? "bg-[#4F8CFF]" : "bg-slate-300"
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${
                  studyPrefs.preferMorning ? "left-6" : "left-0.5"
                }`} />
              </button>
            </div>

            {prefMsg && <p className="text-green-500 text-sm">{prefMsg}</p>}
            <button
              onClick={savePrefs}
              className="px-4 py-2 bg-[#4F8CFF] text-white rounded-xl text-sm hover:bg-[#3a7ae0] transition-colors"
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* About Tab */}
      {activeTab === "about" && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="text-center py-6">
            <img src="/num-logo.png" alt="NUM Logo" className="w-16 h-16 object-contain mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800">AI-Based Study Planner</h2>
            <p className="text-slate-500 text-sm mt-1">Version 1.0.0</p>
          </div>
          <div className="space-y-3 mt-6">
            <div className="flex justify-between p-4 bg-[#F0F4FF] rounded-xl">
              <span className="text-sm text-slate-600">Institution</span>
              <span className="text-sm font-medium text-slate-800">National University of Management</span>
            </div>
            <div className="flex justify-between p-4 bg-[#F0F4FF] rounded-xl">
              <span className="text-sm text-slate-600">Faculty</span>
              <span className="text-sm font-medium text-slate-800">Information Technology</span>
            </div>
            <div className="flex justify-between p-4 bg-[#F0F4FF] rounded-xl">
              <span className="text-sm text-slate-600">Academic Year</span>
              <span className="text-sm font-medium text-slate-800">2025–2026</span>
            </div>
            <div className="flex justify-between p-4 bg-[#F0F4FF] rounded-xl">
              <span className="text-sm text-slate-600">Group</span>
              <span className="text-sm font-medium text-slate-800">Group 13</span>
            </div>
            <div className="p-4 bg-[#F0F4FF] rounded-xl">
              <p className="text-sm text-slate-600 mb-2">Developed by</p>
              <p className="text-sm font-medium text-slate-800">យ៉ា ចំរើនរតនៈ</p>
              <p className="text-sm font-medium text-slate-800">មោង ធីតា</p>
              <p className="text-sm font-medium text-slate-800">យ៉ែន សុវិចឆិកា</p>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}