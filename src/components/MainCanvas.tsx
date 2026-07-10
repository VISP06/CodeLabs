import { useRef, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { SNIPPET_LINES } from "../hooks/useTypingEngine";
import Auth from "./Auth";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MainCanvasProps {
  targetText: string;
  userInput: string;
  /** Global flat index of the error; -1 = no error */
  errorIndex: number;
  isCompleted: boolean;
  /** When true, untyped characters are hidden (opacity-0) */
  isBlindMode: boolean;
  onFocus: () => void;
  /** Active Supabase session — null for guests */
  session: Session | null;
  /** Current WPM — used when saving to the leaderboard */
  wpm: number;
  /** Current accuracy — used when saving to the leaderboard */
  accuracy: number;
  /** Elapsed seconds from first keystroke to completion */
  timeTaken: number;
  /** Canonical snippet title used as the DB key (e.g. "Binary Search") */
  snippetTitle: string;
  /** Programming language label stored alongside the record */
  snippetLanguage: string;
  /** Callback to tell App to increment the guest completion counter */
  onGuestComplete: () => void;
  /** Controls paywall modal visibility (lifted to App) */
  showPaywall: boolean;
  onClosePaywall: () => void;
}

// ── Char-style helper ─────────────────────────────────────────────────────────

const getCharStyle = (index: number): string => {
  let count = 0;
  for (let li = 0; li < SNIPPET_LINES.length; li++) {
    const line = SNIPPET_LINES[li];
    for (let ti = 0; ti < line.tokens.length; ti++) {
      const token = line.tokens[ti];
      if (index >= count && index < count + token.text.length) {
        return token.colorClass;
      }
      count += token.text.length;
    }
    if (index === count) return "";
    count += 1; // newline
  }
  return "";
};

// ── Paywall Modal ─────────────────────────────────────────────────────────────

function PaywallModal({ onClose }: { onClose: () => void }) {
  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: "rgba(5,8,18,0.75)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-heading"
    >
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: "rgba(14,21,36,0.95)",
          border: "1px solid rgba(125,211,252,0.15)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 60px rgba(125,211,252,0.06)",
          animation: "paywallIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        {/* Glow strip at the top */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(125,211,252,0.4), transparent)" }}
        />

        {/* Close button */}
        <button
          id="paywall-close-btn"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-150 focus:outline-none"
          style={{ color: "#a0b4c4" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#e0e8f0"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#a0b4c4"; }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
        </button>

        {/* Headline */}
        <div className="px-8 pt-8 pb-2 text-center">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
            style={{
              background: "linear-gradient(135deg, rgba(125,211,252,0.15), rgba(200,160,240,0.12))",
              border: "1px solid rgba(125,211,252,0.25)",
              boxShadow: "0 0 30px rgba(125,211,252,0.12)",
            }}
          >
            <span className="material-symbols-outlined text-primary" style={{ fontSize: "24px" }}>
              emoji_events
            </span>
          </div>

          <h2
            id="paywall-heading"
            className="text-xl font-bold text-on-surface"
          >
            Great typing!
          </h2>
          <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
            Create a <span className="text-primary font-medium">free account</span> to track your WPM,
            save your progress, and unlock more snippets.
          </p>
        </div>

        {/* Stats teaser */}
        <div
          className="mx-8 my-4 flex gap-3 rounded-xl p-3"
          style={{ background: "rgba(125,211,252,0.05)", border: "1px solid rgba(125,211,252,0.1)" }}
        >
          {[
            { icon: "speed",          label: "WPM Tracking"     },
            { icon: "history",        label: "Progress History"  },
            { icon: "workspace_premium", label: "More Snippets"  },
          ].map(({ icon, label }) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>
                {icon}
              </span>
              <span className="text-xs text-on-surface-variant text-center leading-tight">{label}</span>
            </div>
          ))}
        </div>

        {/* Embedded Auth — ambient glows hidden inside modal */}
        <div
          className="overflow-y-auto"
          style={{ maxHeight: "65vh" }}
        >
          <div
            /* Override Auth's min-h-screen so it flows naturally inside the modal */
            style={{ "--auth-inner": "1" } as React.CSSProperties}
            className="[&>div]:min-h-0 [&>div]:py-0 [&_.glass]:shadow-none [&_.glass]:border-0 [&_.glass]:bg-transparent [&_div[aria-hidden]]:hidden"
          >
            <Auth />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes paywallIn {
          from { opacity: 0; transform: scale(0.92) translateY(24px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MainCanvas({
  targetText,
  userInput,
  errorIndex,
  isCompleted,
  isBlindMode,
  onFocus,
  session,
  wpm,
  accuracy,
  timeTaken,
  snippetTitle,
  snippetLanguage,
  onGuestComplete,
  showPaywall,
  onClosePaywall,
}: MainCanvasProps) {
  const cursorRef = useRef<HTMLSpanElement | null>(null);
  const prevCompleted = useRef(false);
  /** Guards the Supabase insert so it fires at most once per completed run */
  const statSaved = useRef(false);

  // Scroll the active cursor character into view
  useEffect(() => {
    cursorRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [userInput.length]);

  // Reset the save-guard whenever a new run starts (isCompleted goes false again)
  useEffect(() => {
    if (!isCompleted) {
      statSaved.current = false;
    }
  }, [isCompleted]);

  // Detect rising edge of isCompleted
  useEffect(() => {
    if (!isCompleted || prevCompleted.current) return;

    if (session) {
      // ── Authenticated: smart high-score save (exactly once per run) ──
      if (!statSaved.current) {
        statSaved.current = true;

        // Extract username: everything before the '@' in the user's email
        const username = (session.user.email ?? "").split("@")[0] || "anonymous";

        (async () => {
          // 1. Check if a record already exists for this user + snippet
          const { data: existing, error: fetchErr } = await supabase
            .from("typing_stats")
            .select("id, wpm, accuracy")
            .eq("user_id", session.user.id)
            .eq("snippet_name", snippetTitle)
            .maybeSingle();

          if (fetchErr) {
            console.error("[CodeLabs] Failed to check existing record:", fetchErr.message);
            return;
          }

          if (!existing) {
            // 2a. No record yet — insert fresh
            const { error: insertErr } = await supabase
              .from("typing_stats")
              .insert({
                user_id: session.user.id,
                username,
                snippet_name: snippetTitle,
                language: snippetLanguage,
                wpm,
                accuracy,
                time_taken: timeTaken,
              });
            if (insertErr)
              console.error("[CodeLabs] Insert failed:", insertErr.message);
          } else if (wpm > existing.wpm && accuracy >= existing.accuracy) {
            // 2b. Existing record — only overwrite if this run is strictly better
            const { error: updateErr } = await supabase
              .from("typing_stats")
              .update({
                username,
                wpm,
                accuracy,
                time_taken: timeTaken,
              })
              .eq("id", existing.id);
            if (updateErr)
              console.error("[CodeLabs] Update failed:", updateErr.message);
          }
          // else: existing record is already better — do nothing
        })();
      }
    } else {
      // ── Guest: increment paywall counter ───────────────────────────
      onGuestComplete();
    }

    prevCompleted.current = isCompleted;
  }, [isCompleted, session, wpm, accuracy, timeTaken, onGuestComplete]);

  // Keep prevCompleted in sync when isCompleted resets to false
  useEffect(() => {
    if (!isCompleted) prevCompleted.current = false;
  }, [isCompleted]);

  const lines = targetText.split("\n");
  let globalCharIndex = 0;

  return (
    <>
      <div
        className="w-full max-w-[900px] flex-grow flex flex-col justify-center px-4 overflow-hidden relative mb-24"
        onClick={onFocus}
      >
        <div className="w-full glass rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-y-auto hide-scroll ring-1 ring-white/5">
          <div className="flex flex-row gap-4 font-mono text-[16px]">
            {/* Left Column (Line Numbers) */}
            <div className="flex flex-col text-right select-none opacity-40 min-w-[3rem] border-r border-white/10 pr-4 mr-2">
              {lines.map((_, i) => (
                <span key={i}>{i + 1}</span>
              ))}
            </div>

            {/* Right Column (Code Text) */}
            <div className="flex flex-col relative">
              {lines.map((line, lineIndex) => (
                <div key={lineIndex} className="flex flex-row whitespace-pre">
                  {line.split("").map((char) => {
                    const currentIndex = globalCharIndex++;
                    const isTyped   = currentIndex < userInput.length;
                    const isCurrent = currentIndex === userInput.length;
                    const isError   = isTyped && userInput[currentIndex] !== char;
                    const cursorColorClass = errorIndex !== -1 ? "border-red-500" : "border-[#7ae2ff]";

                    return (
                      <span
                        key={currentIndex}
                        ref={isCurrent ? cursorRef : undefined}
                        className={`
                          relative inline-block
                          ${isError ? "text-red-500 bg-red-500/20" : isTyped ? "opacity-100" : isBlindMode ? "opacity-0" : "opacity-30"}
                          ${isCurrent ? `border-l-2 ${cursorColorClass} animate-blink` : "border-l-2 border-transparent"}
                          ${getCharStyle(currentIndex)}
                        `.trim()}
                      >
                        {char}
                      </span>
                    );
                  })}

                  {/* Hidden newline cursor handle */}
                  {(() => {
                    const isCurrentNewline = globalCharIndex === userInput.length;
                    globalCharIndex++;
                    const newlineCursorColorClass = errorIndex !== -1 ? "border-red-500" : "border-[#7ae2ff]";
                    return (
                      <span
                        ref={isCurrentNewline ? cursorRef : undefined}
                        className={`inline-block w-2 ${isCurrentNewline ? `border-l-2 ${newlineCursorColorClass} animate-blink` : ""}`}
                      >
                        &nbsp;
                      </span>
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>

          {/* ── Completion overlay ────────────────────────────────────── */}
          {isCompleted && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/60 backdrop-blur-sm">
              <div className="text-center">
                <span className="text-4xl">🎉</span>
                <p className="mt-2 text-primary font-bold text-xl">Snippet Complete!</p>
                <p className="text-on-surface-variant text-sm mt-1">Press Restart to go again</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Soft paywall modal (guest only, after 3 completions) ───────── */}
      {showPaywall && (
        <PaywallModal onClose={onClosePaywall} />
      )}
    </>
  );
}
