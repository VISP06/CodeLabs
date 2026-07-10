import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StatRow {
  id: string;
  user_id: string;
  snippet_name: string;
  language: string;
  wpm: number;
  accuracy: number;
  created_at: string;
}

interface LeaderboardProps {
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format an ISO date string to a short human-readable form */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Return the medal emoji / rank label for top 3 */
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span
        className="flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold"
        style={{
          background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
          color: "#1a0a00",
          boxShadow: "0 0 12px rgba(251,191,36,0.45)",
        }}
      >
        1
      </span>
    );
  if (rank === 2)
    return (
      <span
        className="flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold"
        style={{
          background: "linear-gradient(135deg, #9ca3af, #d1d5db)",
          color: "#111827",
          boxShadow: "0 0 10px rgba(209,213,219,0.3)",
        }}
      >
        2
      </span>
    );
  if (rank === 3)
    return (
      <span
        className="flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold"
        style={{
          background: "linear-gradient(135deg, #b45309, #d97706)",
          color: "#fff7ed",
          boxShadow: "0 0 10px rgba(217,119,6,0.3)",
        }}
      >
        3
      </span>
    );
  return (
    <span className="flex items-center justify-center w-7 h-7 text-sm text-on-surface-variant font-mono">
      {rank}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Leaderboard({ onClose }: LeaderboardProps) {
  const [rows, setRows] = useState<StatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("typing_stats")
      .select("*")
      .order("wpm", { ascending: false })
      .limit(10);

    if (error) {
      setError("Failed to load leaderboard. Please try again.");
    } else {
      setRows((data as StatRow[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center px-4"
      style={{
        background: "rgba(5,8,18,0.78)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        animation: "lbOverlayIn 0.2s ease both",
      }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="leaderboard-heading"
    >
      <div
        className="relative w-full max-w-lg rounded-3xl overflow-hidden flex flex-col"
        style={{
          background: "rgba(10,16,28,0.97)",
          border: "1px solid rgba(125,211,252,0.12)",
          boxShadow:
            "0 24px 80px rgba(0,0,0,0.75), 0 0 80px rgba(125,211,252,0.05)",
          animation: "lbPanelIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
          maxHeight: "90vh",
        }}
      >
        {/* ── Shimmer top border ─────────────────────────────────────────── */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(125,211,252,0.45), transparent)",
          }}
        />

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 px-6 pt-6 pb-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          {/* Trophy icon */}
          <div
            className="flex items-center justify-center w-10 h-10 rounded-2xl shrink-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.12))",
              border: "1px solid rgba(251,191,36,0.3)",
              boxShadow: "0 0 24px rgba(251,191,36,0.15)",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "22px",
                color: "#fbbf24",
                fontVariationSettings: "'FILL' 1",
              }}
            >
              emoji_events
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h2
              id="leaderboard-heading"
              className="text-lg font-bold text-on-surface leading-tight"
            >
              Global Leaderboard
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Top 10 all-time runs
            </p>
          </div>

          {/* Refresh */}
          <button
            id="leaderboard-refresh-btn"
            aria-label="Refresh leaderboard"
            onClick={fetchLeaderboard}
            disabled={loading}
            className="flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-150 focus:outline-none mr-1"
            style={{ color: "#a0b4c4", background: "rgba(255,255,255,0.04)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            }}
          >
            <span
              className={`material-symbols-outlined ${loading ? "animate-spin" : ""}`}
              style={{ fontSize: "18px" }}
            >
              refresh
            </span>
          </button>

          {/* Close */}
          <button
            id="leaderboard-close-btn"
            aria-label="Close leaderboard"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-150 focus:outline-none"
            style={{ color: "#a0b4c4", background: "rgba(255,255,255,0.04)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "#e0e8f0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.color = "#a0b4c4";
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              close
            </span>
          </button>
        </div>

        {/* ── Column headers ─────────────────────────────────────────────── */}
        <div
          className="grid px-5 py-2 shrink-0"
          style={{
            gridTemplateColumns: "2.5rem 1fr 5rem 5rem 6rem",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          {["#", "Snippet", "WPM", "Acc", "Date"].map((h) => (
            <span key={h} className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              {h}
            </span>
          ))}
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 min-h-0 px-2 py-2">
          {/* Loading skeleton */}
          {loading && (
            <div className="flex flex-col gap-2 p-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 rounded-xl animate-pulse"
                  style={{ background: "rgba(255,255,255,0.04)", opacity: 1 - i * 0.15 }}
                />
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "36px", color: "#f87171" }}
              >
                error_outline
              </span>
              <p className="text-sm text-on-surface-variant">{error}</p>
              <button
                onClick={fetchLeaderboard}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{
                  background: "rgba(125,211,252,0.1)",
                  border: "1px solid rgba(125,211,252,0.25)",
                  color: "#7dd3fc",
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && rows.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "40px", color: "rgba(125,211,252,0.3)" }}
              >
                leaderboard
              </span>
              <p className="text-sm text-on-surface-variant">
                No runs yet. Be the first to set a score!
              </p>
            </div>
          )}

          {/* Rows */}
          {!loading &&
            !error &&
            rows.map((row, i) => {
              const rank = i + 1;
              const isTop3 = rank <= 3;
              return (
                <div
                  key={row.id}
                  className="grid items-center px-3 py-2.5 rounded-xl mb-1 transition-colors duration-100"
                  style={{
                    gridTemplateColumns: "2.5rem 1fr 5rem 5rem 6rem",
                    background: isTop3
                      ? rank === 1
                        ? "rgba(251,191,36,0.05)"
                        : "rgba(255,255,255,0.03)"
                      : "transparent",
                    border: isTop3
                      ? `1px solid ${
                          rank === 1
                            ? "rgba(251,191,36,0.15)"
                            : "rgba(255,255,255,0.05)"
                        }`
                      : "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(125,211,252,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isTop3
                      ? rank === 1
                        ? "rgba(251,191,36,0.05)"
                        : "rgba(255,255,255,0.03)"
                      : "transparent";
                  }}
                >
                  {/* Rank */}
                  <div>
                    <RankBadge rank={rank} />
                  </div>

                  {/* Snippet name */}
                  <div className="min-w-0 pr-2">
                    <p className="text-sm font-medium text-on-surface truncate">
                      {row.snippet_name}
                    </p>
                    <p className="text-xs text-on-surface-variant">{row.language}</p>
                  </div>

                  {/* WPM */}
                  <div>
                    <span
                      className="text-sm font-bold font-mono"
                      style={{ color: "#7dd3fc" }}
                    >
                      {row.wpm}
                    </span>
                    <span className="text-xs text-on-surface-variant ml-0.5">wpm</span>
                  </div>

                  {/* Accuracy */}
                  <div>
                    <span
                      className="text-sm font-bold font-mono"
                      style={{
                        color:
                          row.accuracy >= 98
                            ? "#4ade80"
                            : row.accuracy >= 95
                              ? "#7dd3fc"
                              : "#facc15",
                      }}
                    >
                      {row.accuracy}%
                    </span>
                  </div>

                  {/* Date */}
                  <div>
                    <span className="text-xs text-on-surface-variant">
                      {formatDate(row.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>

        {/* ── Footer note ────────────────────────────────────────────────── */}
        <div
          className="px-6 py-3 shrink-0 text-center"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <p className="text-xs text-on-surface-variant">
            Usernames coming soon · Stats saved for logged-in users only
          </p>
        </div>
      </div>

      <style>{`
        @keyframes lbOverlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes lbPanelIn {
          from { opacity: 0; transform: scale(0.93) translateY(20px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </div>
  );
}
