import { useState, useRef, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { Trophy, Code2, Settings, LogOut } from "lucide-react";
import { supabase } from "../lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

interface HeaderProps {
  session: Session | null;
  /** Opens the auth modal from App — used by Log In button and Sign Out */
  onOpenAuthModal: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Header({
  session,
  onOpenAuthModal,
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [bestWpm, setBestWpm] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      if (!session?.user?.id) return;
      try {
        // Fetch highest WPM
        const { data: wpmData } = await supabase
          .from("typing_stats")
          .select("wpm")
          .eq("user_id", session.user.id)
          .order("wpm", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (wpmData) {
          setBestWpm(wpmData.wpm);
        }

        // Fetch total completed snippets
        const { count } = await supabase
          .from("typing_stats")
          .select("*", { count: "exact", head: true })
          .eq("user_id", session.user.id);

        if (count !== null) {
          setCompletedCount(count);
        }
      } catch (err) {
        console.error("Failed to fetch user stats", err);
      }
    };
    if (dropdownOpen) {
      fetchStats();
    }
  }, [session?.user?.id, dropdownOpen]);

  // Derive the display initial from the user's email or metadata
  const userEmail = session?.user?.email ?? "";
  const currentUsername = session?.user?.user_metadata?.username || userEmail.split('@')[0] || "Anonymous";
  const avatarLetter = currentUsername.charAt(0).toUpperCase() || "?";

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
    // Re-open auth modal so the user lands back on the login screen
    onOpenAuthModal();
  };

  return (
    <header className="glass relative sticky top-0 z-50 flex items-center px-6 w-full h-[72px] shrink-0 border-b border-white/5">

      {/* ── Left Column: Brand ─────────────────────────────────────────── */}
      <div className="flex items-center justify-start">
        <div className="flex items-center gap-2 text-primary hover:opacity-80 transition-all cursor-pointer shrink-0">
          <span className="material-symbols-outlined text-3xl font-bold">terminal</span>
          <span className="text-xl font-bold tracking-tight">&gt;_ CodeLabs</span>
        </div>
      </div>

      {/* ── Right Column: Stats + Profile ─────────────────────────────── */}
      <div className="ml-auto flex items-center gap-4 justify-end">


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
            /* ── Guest: "Log In" button ─────────────────────────────── */
            <button
              id="header-login-btn"
              aria-label="Log in to CodeLabs"
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              style={{
                background: "linear-gradient(135deg, rgba(125,211,252,0.18), rgba(200,160,240,0.14))",
                border: "1px solid rgba(125,211,252,0.35)",
                color: "#7dd3fc",
                boxShadow: "0 0 14px rgba(125,211,252,0.12)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(125,211,252,0.28), rgba(200,160,240,0.22))";
                e.currentTarget.style.boxShadow = "0 0 22px rgba(125,211,252,0.22)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(125,211,252,0.18), rgba(200,160,240,0.14))";
                e.currentTarget.style.boxShadow = "0 0 14px rgba(125,211,252,0.12)";
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>login</span>
              Log In
            </button>
          )}

          {/* ── Dropdown menu ───────────────────────────────────────────── */}
          {session && dropdownOpen && (
            <div
              role="menu"
              aria-label="Account options"
              className="absolute right-0 mt-2 w-72 rounded-2xl overflow-hidden"
              style={{
                background: "rgba(14,21,36,0.92)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
                animation: "dropdownIn 0.18s cubic-bezier(0.4,0,0.2,1) both",
              }}
            >
              <div className="p-4 flex flex-col gap-4">
                {/* 1. Identity Block */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full shrink-0" style={{ background: "rgba(125,211,252,0.15)", color: "#7dd3fc" }}>
                    <span className="font-bold text-lg">{avatarLetter}</span>
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-bold text-on-surface truncate leading-tight text-[15px]">{currentUsername}</span>
                    <span className="text-sm text-gray-400 truncate mt-0.5">{userEmail}</span>
                  </div>
                </div>

                {/* 2. Quick Stats */}
                <div className="border-t border-gray-700/50 pt-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <Trophy size={16} className="text-yellow-500" />
                    <span>Best: {bestWpm} WPM</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <Code2 size={16} className="text-cyan-400" />
                    <span>Completed: {completedCount}</span>
                  </div>
                </div>

                {/* 3. Action Links */}
                <div className="border-t border-gray-700/50 pt-3 flex flex-col gap-1">
                  <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-on-surface-variant transition-colors hover:bg-white/5 hover:text-on-surface focus:outline-none">
                    <Settings size={18} />
                    Preferences
                  </button>
                  <button
                    id="header-signout-btn"
                    role="menuitem"
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 transition-colors hover:text-red-400 hover:bg-red-500/10 focus:outline-none mt-1"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </div>
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
