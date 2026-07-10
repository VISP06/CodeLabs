import "./index.css";
import { useState, useEffect, useCallback } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "./lib/supabase";
import Header from "./components/Header";
import MobileContextBar from "./components/MobileContextBar";
import LanguageDropdown from "./components/LanguageDropdown";
import MainCanvas from "./components/MainCanvas";
import ActionFooter from "./components/ActionFooter";
import AmbientGlows from "./components/AmbientGlows";
import Auth from "./components/Auth";
import Leaderboard from "./components/Leaderboard";
import { useTypingEngine } from "./hooks/useTypingEngine";

// ─── How many snippets a guest can complete before the paywall fires ───────────
const GUEST_FREE_COMPLETIONS = 3;

/**
 * App — Phase 5: Session Management & Soft Paywall
 *
 * Routing logic:
 *   - Everyone lands on the main CodeLabs editor (Guest Mode).
 *   - Authenticated users see a lettered avatar in the Header with a Sign Out
 *     dropdown.
 *   - After GUEST_FREE_COMPLETIONS snippet completions without an account, the
 *     soft-paywall modal (embedded inside MainCanvas) is triggered.
 */
function App() {
  // ── Auth state ────────────────────────────────────────────────────────
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Auth modal visibility ─────────────────────────────────────────────
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // ── Leaderboard panel visibility ───────────────────────────────────
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  // ── Guest completion counter ──────────────────────────────────────────
  const [guestSnippetsCompleted, setGuestSnippetsCompleted] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);

  const handleGuestComplete = useCallback(() => {
    setGuestSnippetsCompleted((prev) => {
      const next = prev + 1;
      if (next >= GUEST_FREE_COMPLETIONS) {
        setShowPaywall(true);
        setIsAuthModalOpen(true);
      }
      return next;
    });
  }, []);

  // Reset counter + close auth modal when the user logs in
  useEffect(() => {
    if (session) {
      setGuestSnippetsCompleted(0);
      setShowPaywall(false);
      setIsAuthModalOpen(false);
    }
  }, [session]);

  // ── Typing engine ─────────────────────────────────────────────────────
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

  const [isBlindMode, setIsBlindMode] = useState(false);
  const toggleBlindMode = () => setIsBlindMode((prev) => !prev);

  // Canonical snippet descriptor — used in the UI and as the DB key
  const SNIPPET_NAME = "Binary Search";
  const LANGUAGE = "Python";

  // ── Loading splash (flicker prevention) ──────────────────────────────
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"
          aria-label="Loading"
        />
      </div>
    );
  }

  // ── Main application (guests + authenticated users) ───────────────────
  return (
    <div className="text-on-surface flex flex-col font-sans overflow-hidden selection:bg-primary/30 selection:text-primary min-h-screen">
      {/* ── Ambient decorative glows ──────────────────────────────────── */}
      <AmbientGlows />

      {/* ── Top App Bar ───────────────────────────────────────────────── */}
      <Header
        snippetName={SNIPPET_NAME}
        wpm={wpm}
        accuracy={accuracy}
        session={session}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* ── Main Content Area ─────────────────────────────────────────── */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 w-full max-w-5xl mx-auto relative h-full">
        {/* Mobile context headers — hidden on md+ */}
        <MobileContextBar
          language={LANGUAGE}
          snippetName={SNIPPET_NAME}
          wpm={wpm}
          accuracy={accuracy}
        />

        {/* Language selector — desktop row above canvas */}
        <LanguageDropdown language={LANGUAGE} />

        {/* Typing canvas — passes session, stats, and paywall controls down */}
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
          snippetTitle={SNIPPET_NAME}
          snippetLanguage={LANGUAGE}
          onGuestComplete={handleGuestComplete}
          showPaywall={showPaywall}
          onClosePaywall={() => setShowPaywall(false)}
        />
      </main>

      {/* ── Floating Action Bar ───────────────────────────────────────── */}
      <ActionFooter
        onRestart={restart}
        isBlindMode={isBlindMode}
        onToggleBlindMode={toggleBlindMode}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
      />

      {/* ── Leaderboard Modal ───────────────────────────────────────── */}
      {isLeaderboardOpen && (
        <Leaderboard onClose={() => setIsLeaderboardOpen(false)} />
      )}

      {/* ── Auth Modal Overlay (login / sign-up) ──────────────────────── */}
      {isAuthModalOpen && !session && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center px-4"
          style={{
            background: "rgba(5,8,18,0.80)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            animation: "authOverlayIn 0.2s ease both",
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Authentication"
        >
          {/* Close button — lets users dismiss and return to canvas */}
          <button
            id="auth-modal-close-btn"
            aria-label="Close login"
            onClick={() => setIsAuthModalOpen(false)}
            className="absolute top-4 right-4 flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-150 focus:outline-none"
            style={{ color: "#a0b4c4", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
          </button>
          <Auth />
        </div>
      )}

      <style>{`
        @keyframes authOverlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default App;
