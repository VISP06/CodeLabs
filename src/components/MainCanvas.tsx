import { useRef, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Language, SnippetLine } from "../data/snippets";
import Auth from "./Auth";
import LanguageDropdown from "./LanguageDropdown";

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
  /** Active snippet lines for syntax highlighting */
  snippetLines: SnippetLine[];
  /** Callback to tell App to increment the guest completion counter */
  onGuestComplete: () => void;
  /** Controls paywall modal visibility (lifted to App) */
  showPaywall: boolean;
  onClosePaywall: () => void;
  activeLanguage: Language;
  setActiveLanguage: (lang: Language) => void;
  liveTime: number;
}

// ── Char-style helper ─────────────────────────────────────────────────────────

const getCharStyle = (index: number, snippetLines: SnippetLine[]): string => {
  let count = 0;
  for (let li = 0; li < snippetLines.length; li++) {
    const line = snippetLines[li];
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
            { icon: "speed", label: "WPM Tracking" },
            { icon: "history", label: "Progress History" },
            { icon: "workspace_premium", label: "More Snippets" },
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
  snippetLines,
  onGuestComplete,
  showPaywall,
  onClosePaywall,
  activeLanguage,
  setActiveLanguage,
  liveTime,
}: MainCanvasProps) {
  const cursorRef = useRef<HTMLSpanElement | null>(null);
  const prevCompleted = useRef(false);
  /** Guards the Supabase insert so it fires at most once per completed run */
  const statSaved = useRef(false);

  // Scroll the active cursor character into view
  useEffect(() => {
    cursorRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [userInput.length]);

  // Reset the save-guard whenever a new run starts (isCompleted goes false again)
  useEffect(() => {
    if (!isCompleted) {
      statSaved.current = false;
    }
  }, [isCompleted]);

  const handleSnippetComplete = async (finalWpm: number, finalAccuracy: number, finalTime: number) => {
    const currentUsername = session?.user?.user_metadata?.username || session?.user?.email?.split('@')[0] || 'Anonymous';
    const snippetName = snippetTitle;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // Stop if not logged in

      // 1. Fetch the existing run for this specific user, snippet, and language
      const { data: existingRun, error: fetchError } = await supabase
        .from('typing_stats')
        .select('*')
        .eq('snippet_name', snippetName)
        .eq('language', activeLanguage)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error("Fetch Error:", fetchError);
        return;
      }

      if (existingRun) {
        // 2. ONLY update if the new WPM is higher
        if (finalWpm > existingRun.wpm) {
          const { data: updatedData, error: updateError } = await supabase
            .from('typing_stats')
            .update({ wpm: finalWpm, accuracy: finalAccuracy, time_taken: finalTime })
            .eq('user_id', user.id)
            .eq('snippet_name', snippetName)
            .eq('language', activeLanguage)
            .select(); // Force Supabase to return the modified row

          if (updateError) {
            console.log("Update blocked by database: " + updateError.message);
            console.error("Update Error:", updateError);
          } else if (!updatedData || updatedData.length === 0) {
            // THIS IS THE SILENT FAILURE DETECTOR
            console.log("🚨 SILENT DROP: Supabase blocked the update! Check your RLS UPDATE policies.");
          }
        }
      } else {
        // 3. Fresh insert - Explicitly passing user_id to prevent null constraints
        const { error: insertError } = await supabase
          .from('typing_stats')
          .insert([{
            snippet_name: snippetName,
            wpm: finalWpm,
            accuracy: finalAccuracy,
            time_taken: finalTime,
            language: activeLanguage,
            username: currentUsername,
            user_id: user.id
          }]);

        if (insertError) {
          console.log("Insert blocked by database: " + insertError.message);
          console.error("Insert Error:", insertError);
        }
      }
    } catch (err) {
      console.error("Critical DB Save Error:", err);
    }
  };
  // Detect rising edge of isCompleted
  useEffect(() => {
    if (!isCompleted || prevCompleted.current) return;

    if (session?.user) {
      // ── Authenticated: smart high-score save (exactly once per run) ──
      if (!statSaved.current) {
        statSaved.current = true;
        handleSnippetComplete(wpm, accuracy, timeTaken);
      }
    } else {
      // ── Guest: increment paywall counter ───────────────────────────
      onGuestComplete();
    }

    prevCompleted.current = isCompleted;
  }, [isCompleted, session, wpm, accuracy, timeTaken, onGuestComplete, activeLanguage, snippetTitle]);

  // Keep prevCompleted in sync when isCompleted resets to false
  useEffect(() => {
    if (!isCompleted) prevCompleted.current = false;
  }, [isCompleted]);

  const lines = targetText.split("\n");
  let globalCharIndex = 0;

  return (
    <>
      <div className="flex justify-between items-center w-full max-w-[900px] mb-4">
        {/* Left Side: Dropdown */}
        <div className="flex items-center gap-4">
          <LanguageDropdown
            activeLanguage={activeLanguage}
            setActiveLanguage={setActiveLanguage}
          />
        </div>

        {/* Right Side: Live Stats Pill */}
        <div className="flex bg-white/5 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
          <span className="text-sm font-mono text-on-surface-variant">
            WPM: <strong className="text-primary">{wpm}</strong> | Acc:{" "}
            <strong className="text-primary">{accuracy}%</strong> | Time:{" "}
            <strong className="text-primary">{liveTime.toFixed(1)}s</strong>
          </span>
        </div>
      </div>
      <div
        className="w-full max-w-[900px] flex-grow flex flex-col justify-center px-4 overflow-hidden relative mb-24"
        onClick={onFocus}
      >
        <div className="w-full glass rounded-2xl p-6 sm:p-8 pb-[50vh] sm:pb-[50vh] shadow-2xl relative overflow-y-auto hide-scroll ring-1 ring-white/5 max-h-[60vh]">
          <div className="flex flex-row gap-4 font-mono text-[16px]">
            {/* Left Column (Line Numbers) */}
            <div className="flex flex-col text-right select-none opacity-40 min-w-[3rem] border-r border-white/10 pr-4 mr-2">
              {lines.map((_, i) => (
                <span key={i}>{i + 1}</span>
              ))}
            </div>

            {/* Right Column (Code Text) */}
            <div className="flex flex-col relative w-full overflow-hidden">
              {lines.map((line, lineIndex) => (
                <div key={lineIndex} className="flex flex-row flex-wrap whitespace-pre-wrap break-words">
                  {line.split("").map((char) => {
                    const currentIndex = globalCharIndex++;
                    const isTyped = currentIndex < userInput.length;
                    const isCurrent = currentIndex === userInput.length;
                    const isError = isTyped && userInput[currentIndex] !== char;
                    const cursorColorClass = errorIndex !== -1 ? "border-red-500" : "border-[#7ae2ff]";

                    return (
                      <span
                        key={currentIndex}
                        ref={isCurrent ? cursorRef : undefined}
                        className={`
                          relative inline-block
                          ${isError ? "text-red-500 bg-red-500/20" : isTyped ? "opacity-100" : isBlindMode ? "opacity-0" : "opacity-30"}
                          ${isCurrent ? `border-l-2 ${cursorColorClass} animate-blink` : "border-l-2 border-transparent"}
                          ${getCharStyle(currentIndex, snippetLines)}
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
              <div className="text-center bg-[#0a101c]/95 border border-[#7dd3fc]/20 p-6 rounded-2xl shadow-2xl backdrop-blur-md" style={{ animation: "lbPanelIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both" }}>
                <span className="text-4xl block mb-2">🎉</span>
                <h3 className="text-primary font-bold text-xl mb-4">Snippet Complete!</h3>
                <div className="flex gap-6 items-center justify-center text-sm mb-5 bg-white/5 rounded-xl px-5 py-3 border border-white/5">
                  <div className="flex flex-col items-center">
                    <span className="text-[#8a9eb0] uppercase text-[10px] font-bold tracking-wider mb-1">Speed</span>
                    <span className="text-[#e0e8f0] font-mono text-base">{wpm} <span className="text-xs text-[#6b8090]">WPM</span></span>
                  </div>
                  <div className="w-px h-8 bg-white/10"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-[#8a9eb0] uppercase text-[10px] font-bold tracking-wider mb-1">Accuracy</span>
                    <span className="text-[#e0e8f0] font-mono text-base">{accuracy}%</span>
                  </div>
                  <div className="w-px h-8 bg-white/10"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-[#8a9eb0] uppercase text-[10px] font-bold tracking-wider mb-1">Time</span>
                    <span className="text-[#e0e8f0] font-mono text-base">{timeTaken}s</span>
                  </div>
                </div>
                <p className="text-[#8a9eb0] text-sm mt-1">Press Restart to go again</p>
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
