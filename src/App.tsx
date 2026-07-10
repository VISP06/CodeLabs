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

  // ── Guest completion counter ──────────────────────────────────────────
  const [guestSnippetsCompleted, setGuestSnippetsCompleted] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);

  const handleGuestComplete = useCallback(() => {
    setGuestSnippetsCompleted((prev) => {
      const next = prev + 1;
      if (next >= GUEST_FREE_COMPLETIONS) {
        setShowPaywall(true);
      }
      return next;
    });
  }, []);

  // Reset counter when the user logs in
  useEffect(() => {
    if (session) {
      setGuestSnippetsCompleted(0);
      setShowPaywall(false);
    }
  }, [session]);

  // ── Typing engine ─────────────────────────────────────────────────────
  const {
    targetText,
    userInput,
    errorIndex,
    wpm,
    accuracy,
    isCompleted,
    focusInput,
    restart,
  } = useTypingEngine();

  const [isBlindMode, setIsBlindMode] = useState(false);
  const toggleBlindMode = () => setIsBlindMode((prev) => !prev);

  const SNIPPET_NAME = "Binary Search Algorithm";
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

        {/* Typing canvas — passes session and paywall controls down */}
        <MainCanvas
          targetText={targetText}
          userInput={userInput}
          errorIndex={errorIndex}
          isCompleted={isCompleted}
          isBlindMode={isBlindMode}
          onFocus={focusInput}
          session={session}
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
      />
    </div>
  );
}

export default App;
