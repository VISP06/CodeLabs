import { useState, useRef, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

interface HeaderProps {
  snippetName?: string;
  wpm?: number;
  accuracy?: number;
  session: Session | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Header({
  snippetName = "Binary Search Algorithm",
  wpm = 0,
  accuracy = 100,
  session,
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Derive the display initial from the user's email
  const userEmail = session?.user?.email ?? "";
  const avatarLetter = userEmail.charAt(0).toUpperCase() || "?";

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [dropdownOpen]);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await supabase.auth.signOut();
    // App.tsx's onAuthStateChange listener will clear the session and re-render
  };

  return (
    <header className="glass sticky top-0 z-50 flex justify-between items-center px-6 w-full h-[72px] shrink-0 border-b border-white/5">

      {/* ── Leading / Brand ───────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-primary hover:opacity-80 transition-all cursor-pointer">
          <span className="material-symbols-outlined text-3xl font-bold">terminal</span>
          <span className="text-xl font-bold tracking-tight">&gt;_ CodeLabs</span>
        </div>
      </div>

      {/* ── Center / Snippet Title (desktop only) ─────────────────────── */}
      <div className="hidden md:flex flex-1 justify-center">
        <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-md">
          <span className="text-sm font-medium text-on-surface-variant">
            {snippetName}
          </span>
        </div>
      </div>

      {/* ── Trailing / Stats + Profile ────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex bg-white/5 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
          <span className="text-sm font-mono text-on-surface-variant">
            WPM: <strong className="text-primary">{wpm}</strong> | Acc:{" "}
            <strong className="text-primary">{accuracy}%</strong>
          </span>
        </div>

        {/* ── Auth avatar / profile icon ──────────────────────────────── */}
        <div className="relative" ref={dropdownRef}>
          {session ? (
            /* ── Logged-in: lettered avatar with dropdown ─────────────── */
            <button
              id="header-avatar-btn"
              aria-label="Account menu"
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold select-none transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              style={{
                background: "linear-gradient(135deg, rgba(125,211,252,0.25), rgba(200,160,240,0.2))",
                border: `1px solid ${dropdownOpen ? "rgba(125,211,252,0.5)" : "rgba(125,211,252,0.3)"}`,
                color: "#7dd3fc",
                boxShadow: dropdownOpen
                  ? "0 0 18px rgba(125,211,252,0.25)"
                  : "0 0 10px rgba(125,211,252,0.1)",
              }}
            >
              {avatarLetter}
            </button>
          ) : (
            /* ── Guest: generic icon, no dropdown ─────────────────────── */
            <button
              aria-label="Profile"
              className="flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition-all text-primary"
            >
              <span className="material-symbols-outlined text-2xl">account_circle</span>
            </button>
          )}

          {/* ── Dropdown menu ───────────────────────────────────────────── */}
          {session && dropdownOpen && (
            <div
              role="menu"
              aria-label="Account options"
              className="absolute right-0 mt-2 w-64 rounded-2xl overflow-hidden"
              style={{
                background: "rgba(14,21,36,0.92)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
                animation: "dropdownIn 0.18s cubic-bezier(0.4,0,0.2,1) both",
              }}
            >
              {/* User info header */}
              <div
                className="px-4 py-3 border-b"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
              >
                <p className="text-xs text-on-surface-variant">Signed in as</p>
                <p
                  className="text-sm font-medium text-on-surface mt-0.5 truncate"
                  title={userEmail}
                >
                  {userEmail}
                </p>
              </div>

              {/* Sign out button */}
              <div className="p-1.5">
                <button
                  id="header-signout-btn"
                  role="menuitem"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors duration-150 focus:outline-none"
                  style={{ color: "#ff6b6b" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,107,107,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                    logout
                  </span>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dropdown entrance keyframe */}
      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </header>
  );
}
