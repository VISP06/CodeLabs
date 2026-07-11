import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import { useTypingEngine } from "./hooks/useTypingEngine";
import Header from "./components/Header";
import MainCanvas from "./components/MainCanvas";
import ActionFooter from "./components/ActionFooter";
import AmbientGlows from "./components/AmbientGlows";
import Auth from "./components/Auth";
import Leaderboard from "./components/Leaderboard";

// ── Guest completion limit before showing paywall ─────────────────────────────
const GUEST_LIMIT = 3;

// ── Standalone Auth modal wrapper ─────────────────────────────────────────────
function AuthModal({ onClose }: { onClose: () => void }) {
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

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{
        background: "rgba(5,8,18,0.80)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Authentication"
    >
      <div
        className="relative w-full max-w-md overflow-y-auto rounded-3xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          id="auth-modal-close-btn"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-150 focus:outline-none"
          style={{ color: "#a0b4c4", background: "rgba(255,255,255,0.06)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.12)";
            e.currentTarget.style.color = "#e0e8f0";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            e.currentTarget.style.color = "#a0b4c4";
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
        </button>

        <Auth />
      </div>
    </div>
  );
}

// ── Root application component ────────────────────────────────────────────────

export default function App() {
  // ── Supabase auth session ────────────────────────────────────────────────────
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Hydrate session on first render
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // Keep session in sync with Supabase auth-state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      // Auto-close the auth modal when the user successfully logs in
      if (newSession) setIsAuthModalOpen(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isBlindMode, setIsBlindMode] = useState(false);

  // ── Guest paywall ────────────────────────────────────────────────────────────
  const [guestCompletions, setGuestCompletions] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);

  const handleGuestComplete = () => {
    setGuestCompletions((prev) => {
      const next = prev + 1;
      if (next >= GUEST_LIMIT) setShowPaywall(true);
      return next;
    });
  };

  // ── Typing engine ─────────────────────────────────────────────────────────────
  const {
    targetText,
    userInput,
    errorIndex,
    wpm,
    accuracy,
    timeTaken,
    isCompleted,
    focusInput,
    restart,
  } = useTypingEngine();

  // Suppress the unused-variable lint warning for guestCompletions
  void guestCompletions;

  return (
    <div
      className="flex flex-col min-h-screen bg-background text-on-surface"
      onClick={focusInput}
    >
      {/* Decorative ambient background glows */}
      <AmbientGlows />

      {/* Sticky top header */}
      <Header
        snippetName="Binary Search"
        wpm={wpm}
        accuracy={accuracy}
        session={session}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main typing canvas */}
      <main className="flex-1 flex flex-col items-center justify-center py-8 px-4">
        <MainCanvas
          targetText={targetText}
          userInput={userInput}
          errorIndex={errorIndex}
          isCompleted={isCompleted}
          isBlindMode={isBlindMode}
          onFocus={focusInput}
          session={session}
          wpm={wpm}
          accuracy={accuracy}
          timeTaken={timeTaken}
          snippetTitle="Binary Search"
          snippetLanguage="Python"
          onGuestComplete={handleGuestComplete}
          showPaywall={showPaywall}
          onClosePaywall={() => setShowPaywall(false)}
        />
      </main>

      {/* Fixed bottom action bar */}
      <ActionFooter
        onRestart={restart}
        isBlindMode={isBlindMode}
        onToggleBlindMode={() => setIsBlindMode((v) => !v)}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
      />

      {/* Auth modal — opened via Header "Log In" button */}
      {isAuthModalOpen && (
        <AuthModal onClose={() => setIsAuthModalOpen(false)} />
      )}

      {/* Leaderboard modal — opened via ActionFooter trophy button */}
      {showLeaderboard && (
        <Leaderboard onClose={() => setShowLeaderboard(false)} />
      )}
    </div>
  );
}
