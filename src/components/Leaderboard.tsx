import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { X } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StatRow {
  id: string;
  user_id: string;
  username: string | null;
  snippet_name: string;
  language: string;
  wpm: number;
  accuracy: number;
  time_taken: number | null;
  created_at: string;
}

interface LeaderboardProps {
  onClose: () => void;
}

// ── Known snippet library (extend as more snippets are added) ─────────────────

const KNOWN_SNIPPETS = [
  "Binary Search",
  // "Bubble Sort",
  // "Merge Sort",
  // "Fibonacci",
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Returns the ISO string for today at local midnight, expressed in UTC */
function todayMidnightISO(): string {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return midnight.toISOString();
}

function RankBadge({ rank }: { rank: number }) {
  const base = "flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold shrink-0";
  if (rank === 1)
    return (
      <span className={base} style={{ background: "linear-gradient(135deg,#f59e0b,#fbbf24)", color: "#1a0a00", boxShadow: "0 0 12px rgba(251,191,36,.45)" }}>1</span>
    );
  if (rank === 2)
    return (
      <span className={base} style={{ background: "linear-gradient(135deg,#9ca3af,#d1d5db)", color: "#111827", boxShadow: "0 0 10px rgba(209,213,219,.3)" }}>2</span>
    );
  if (rank === 3)
    return (
      <span className={base} style={{ background: "linear-gradient(135deg,#b45309,#d97706)", color: "#fff7ed", boxShadow: "0 0 10px rgba(217,119,6,.3)" }}>3</span>
    );
  return (
    <span className="flex items-center justify-center w-7 h-7 text-sm text-on-surface-variant font-mono shrink-0">{rank}</span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Leaderboard({ onClose }: LeaderboardProps) {
  // ── Search / filter state ──────────────────────────────────────────────────
  /** Raw text the user has typed in the search box */
  const [searchText, setSearchText] = useState("");
  /** The snippet that is actively selected (null = show daily-best default) */
  const [activeSnippet, setActiveSnippet] = useState<string | null>(null);
  /** Filtered list of suggestions to show below the search box */
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ── Data state ─────────────────────────────────────────────────────────────
  const [rows, setRows] = useState<StatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // ── Filter suggestions as user types ──────────────────────────────────────
  useEffect(() => {
    const q = searchText.trim().toLowerCase();
    if (q === "") {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const matches = KNOWN_SNIPPETS.filter((s) => s.toLowerCase().includes(q));
    setSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  }, [searchText]);

  // ── Close suggestions on outside click ────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Fetch leaderboard data ─────────────────────────────────────────────────
  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeSnippet) {
        // ── Mode: All-time best for a specific snippet ────────────────────
        const { data, error: err } = await supabase
          .from("typing_stats")
          .select("*")
          .eq("snippet_name", activeSnippet)
          .order("wpm", { ascending: false })
          .limit(10);

        if (err) throw err;
        setRows((data as StatRow[]) ?? []);
      } else {
        // ── Mode: All-time best across all snippets ─────────────────────────
        const { data, error: err } = await supabase
          .from("typing_stats")
          .select("*")
          .order("wpm", { ascending: false })
          .limit(20);

        if (err) throw err;
        setRows((data as StatRow[]) ?? []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[CodeLabs] Leaderboard fetch error:", msg);
      setError("Failed to load leaderboard. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [activeSnippet]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // ── Selecting a suggestion ─────────────────────────────────────────────────
  const handleSuggestionClick = (snippet: string) => {
    setActiveSnippet(snippet);
    setSearchText("");
    setShowSuggestions(false);
    searchRef.current?.blur();
  };

  // ── Clearing the search ────────────────────────────────────────────────────
  const clearSearch = () => {
    setSearchText("");
    setActiveSnippet(null);
    setSuggestions([]);
    setShowSuggestions(false);
    searchRef.current?.focus();
  };

  // ── Modal close handlers ───────────────────────────────────────────────────
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // ── Derived labels ─────────────────────────────────────────────────────────
  const modeLabel = activeSnippet
    ? `All-Time · ${activeSnippet}`
    : "All-Time Top Scores · All Algorithms";

  const emptyMessage = activeSnippet
    ? `No all-time scores for "${activeSnippet}" yet.`
    : "No runs recorded yet. Be the first!";

  // ── Render ─────────────────────────────────────────────────────────────────
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
        className="relative w-full max-w-xl rounded-3xl overflow-hidden flex flex-col"
        style={{
          background: "rgba(10,16,28,0.97)",
          border: "1px solid rgba(125,211,252,0.12)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.75), 0 0 80px rgba(125,211,252,0.05)",
          animation: "lbPanelIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
          maxHeight: "90vh",
        }}
      >
        {/* Shimmer top border */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg,transparent,rgba(125,211,252,.45),transparent)" }}
        />

        {/* ── Header row ──────────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 px-6 pt-6 pb-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          {/* Trophy icon */}
          <div
            className="flex items-center justify-center w-10 h-10 rounded-2xl shrink-0"
            style={{
              background: "linear-gradient(135deg,rgba(251,191,36,.2),rgba(245,158,11,.12))",
              border: "1px solid rgba(251,191,36,.3)",
              boxShadow: "0 0 24px rgba(251,191,36,.15)",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "22px", color: "#fbbf24", fontVariationSettings: "'FILL' 1" }}
            >
              emoji_events
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h2 id="leaderboard-heading" className="text-lg font-bold text-on-surface leading-tight">
              Global Leaderboard
            </h2>
          </div>

          {/* Refresh */}
          <button
            id="leaderboard-refresh-btn"
            aria-label="Refresh leaderboard"
            onClick={fetchLeaderboard}
            disabled={loading}
            className="flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-150 focus:outline-none mr-1"
            style={{ color: "#a0b4c4", background: "rgba(255,255,255,0.04)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
          >
            <span className={`material-symbols-outlined ${loading ? "animate-spin" : ""}`} style={{ fontSize: "18px" }}>
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
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#e0e8f0"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#a0b4c4"; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
          </button>
        </div>

        {/* ── Search bar ──────────────────────────────────────────────────── */}
        <div
          className="px-5 pt-4 pb-3 shrink-0 relative"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
        >
          {/* Input wrapper */}
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all duration-150"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onFocus={() => setShowSuggestions(suggestions.length > 0)}
          >
            {/* Magnifying glass icon */}
            <span
              className="material-symbols-outlined shrink-0"
              style={{ fontSize: "18px", color: "#6b8090" }}
            >
              search
            </span>

            <input
              ref={searchRef}
              id="leaderboard-search-input"
              type="text"
              placeholder="Search algorithm… (e.g. Binary Search)"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                // If the user edits away from a selected snippet, deselect it
                if (activeSnippet && e.target.value !== activeSnippet) {
                  setActiveSnippet(null);
                }
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              className="flex-1 bg-transparent text-sm text-on-surface placeholder-on-surface-variant focus:outline-none min-w-0"
              style={{ caretColor: "#7dd3fc" }}
              autoComplete="off"
              spellCheck={false}
            />

            {/* Clear button — only visible when there is text */}
            {searchText.length > 0 && (
              <button
                id="leaderboard-search-clear-btn"
                aria-label="Clear search"
                onClick={clearSearch}
                className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full transition-colors duration-150 focus:outline-none"
                style={{ background: "rgba(255,255,255,0.1)", color: "#a0b4c4" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.18)"; e.currentTarget.style.color = "#e0e8f0"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#a0b4c4"; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>close</span>
              </button>
            )}
          </div>

          {/* Suggestion dropdown */}
          {showSuggestions && (
            <div
              ref={suggestionsRef}
              className="absolute left-5 right-5 rounded-xl overflow-hidden z-10 mt-1"
              style={{
                background: "rgba(14,21,36,0.98)",
                border: "1px solid rgba(125,211,252,0.15)",
                boxShadow: "0 12px 36px rgba(0,0,0,0.6)",
                animation: "lbSuggestIn 0.12s ease both",
              }}
            >
              {suggestions.map((snippet) => (
                <button
                  key={snippet}
                  onClick={() => handleSuggestionClick(snippet)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors duration-100 focus:outline-none"
                  style={{ color: "#c8dae8" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(125,211,252,0.08)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <span className="material-symbols-outlined shrink-0" style={{ fontSize: "16px", color: "#6b8090" }}>
                    code
                  </span>
                  <span className="flex-1 truncate">{snippet}</span>
                  {activeSnippet === snippet && (
                    <span className="material-symbols-outlined shrink-0" style={{ fontSize: "16px", color: "#7dd3fc" }}>
                      check
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Filter Pill UI */}
          {activeSnippet && (
            <div className="mt-3 flex items-center gap-2" style={{ animation: "fadeSlideIn 0.2s ease-out both" }}>
              <span className="text-sm font-medium" style={{ color: "#8a9eb0" }}>Filter:</span>
              <button
                onClick={() => setActiveSnippet(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 focus:outline-none"
                style={{
                  background: "linear-gradient(135deg, rgba(125,211,252,0.15), rgba(200,160,240,0.12))",
                  border: "1px solid rgba(125,211,252,0.3)",
                  color: "#7dd3fc",
                  boxShadow: "0 0 14px rgba(125,211,252,0.1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(125,211,252,0.25), rgba(200,160,240,0.2))";
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(125,211,252,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(125,211,252,0.15), rgba(200,160,240,0.12))";
                  e.currentTarget.style.boxShadow = "0 0 14px rgba(125,211,252,0.1)";
                }}
              >
                <span>{activeSnippet}</span>
                <X size={14} className="opacity-80" />
              </button>
            </div>
          )}
        </div>

        {/* ── Mode sub-header ──────────────────────────────────────────────── */}
        <div className="px-5 py-2 shrink-0 flex items-center gap-2">
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: "14px",
              color: activeSnippet ? "#7dd3fc" : "#fbbf24",
              fontVariationSettings: "'FILL' 1",
            }}
          >
            {activeSnippet ? "filter_alt" : "today"}
          </span>
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: activeSnippet ? "#7dd3fc" : "#fbbf24" }}
          >
            {modeLabel}
          </span>
        </div>

        {/* ── Column headers ────────────────────────────────────────────────── */}
        <div
          className="grid px-5 py-2 shrink-0"
          style={{
            gridTemplateColumns: "2.5rem 1fr 4.5rem 4.5rem 4.5rem 5.5rem",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          {["#", "Username", "WPM", "ACC", "TIME", "DATE"].map((h) => (
            <span key={h} className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              {h}
            </span>
          ))}
        </div>

        {/* ── Body ──────────────────────────────────────────────────────────── */}
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
              <span className="material-symbols-outlined" style={{ fontSize: "36px", color: "#f87171" }}>
                error_outline
              </span>
              <p className="text-sm text-on-surface-variant">{error}</p>
              <button
                onClick={fetchLeaderboard}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{ background: "rgba(125,211,252,0.1)", border: "1px solid rgba(125,211,252,0.25)", color: "#7dd3fc" }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && rows.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <span className="material-symbols-outlined" style={{ fontSize: "40px", color: "rgba(125,211,252,0.3)" }}>
                leaderboard
              </span>
              <p className="text-sm text-on-surface-variant">{emptyMessage}</p>
            </div>
          )}

          {/* Rows */}
          {!loading && !error && rows.map((row, i) => {
            const rank = i + 1;
            const isTop3 = rank <= 3;
            const displayName = row.username ?? "anonymous";
            const timeTakenDisplay = row.time_taken != null ? `${row.time_taken}s` : "—";

            return (
              <div
                key={row.id}
                className="grid items-center px-3 py-2.5 rounded-xl mb-1 transition-colors duration-100"
                style={{
                  gridTemplateColumns: "2.5rem 1fr 4.5rem 4.5rem 4.5rem 5.5rem",
                  background: isTop3 ? (rank === 1 ? "rgba(251,191,36,0.05)" : "rgba(255,255,255,0.03)") : "transparent",
                  border: isTop3
                    ? `1px solid ${rank === 1 ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.05)"}`
                    : "1px solid transparent",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(125,211,252,0.05)"; }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isTop3
                    ? rank === 1 ? "rgba(251,191,36,0.05)" : "rgba(255,255,255,0.03)"
                    : "transparent";
                }}
              >
                {/* Rank */}
                <div><RankBadge rank={rank} /></div>

                {/* Username + language */}
                <div className="min-w-0 pr-2">
                  <p className="text-sm font-medium text-on-surface truncate">{displayName}</p>
                  <p className="text-xs text-on-surface-variant truncate">{row.snippet_name}</p>
                </div>

                {/* WPM */}
                <div>
                  <span className="text-sm font-bold font-mono" style={{ color: "#7dd3fc" }}>{row.wpm}</span>
                  <span className="text-xs text-on-surface-variant ml-0.5">wpm</span>
                </div>

                {/* Accuracy */}
                <div>
                  <span
                    className="text-sm font-bold font-mono"
                    style={{ color: row.accuracy >= 98 ? "#4ade80" : row.accuracy >= 95 ? "#7dd3fc" : "#facc15" }}
                  >
                    {row.accuracy}%
                  </span>
                </div>

                {/* Time taken */}
                <div>
                  <span className="text-sm font-mono text-on-surface-variant">{timeTakenDisplay}</span>
                </div>

                {/* Date */}
                <div>
                  <span className="text-xs text-on-surface-variant">{formatDate(row.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <div
          className="px-6 py-3 shrink-0 text-center"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <p className="text-xs text-on-surface-variant">
            Stats saved for logged-in users only
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
        @keyframes lbSuggestIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
}
