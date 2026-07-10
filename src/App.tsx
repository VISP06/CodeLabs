import "./index.css";
import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "./lib/supabase";
import Auth from "./components/Auth";
import Header from "./components/Header";
import MobileContextBar from "./components/MobileContextBar";
import LanguageDropdown from "./components/LanguageDropdown";
import MainCanvas from "./components/MainCanvas";
import ActionFooter from "./components/ActionFooter";
import AmbientGlows from "./components/AmbientGlows";
import { useTypingEngine } from "./hooks/useTypingEngine";

/**
 * App — Phase 4: Backend Integration
 *
 * Listens to Supabase auth state:
 *   - No session → renders <Auth /> (login / sign-up screen)
 *   - Active session → renders the main CodeLabs typing application
 *
 * Session is populated via getSession() on mount and kept in sync
 * via onAuthStateChange, so hot-reloads and tab switches are handled.
 */
function App() {
  // ── Auth state ────────────────────────────────────────────────────
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Populate session immediately from local storage / cookie
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    // Keep session in sync across tabs and after sign-in / sign-out
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Typing engine (only used when authenticated) ──────────────────
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

  // ── Loading splash (brief flicker prevention) ─────────────────────
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

  // ── Unauthenticated → Auth screen ─────────────────────────────────
  if (!session) {
    return <Auth />;
  }

  // ── Authenticated → Main application ─────────────────────────────
  return (
    // `dark` class is on <html> (set in index.html); body inherits bg gradient from index.css
    <div className="text-on-surface flex flex-col font-sans overflow-hidden selection:bg-primary/30 selection:text-primary min-h-screen">
      {/* ── Ambient decorative glows (behind everything) ─────────── */}
      <AmbientGlows />

      {/* ── Top App Bar ─────────────────────────────────────────── */}
      <Header
        snippetName={SNIPPET_NAME}
        wpm={wpm}
        accuracy={accuracy}
      />

      {/* ── Main Content Area ───────────────────────────────────── */}
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

        {/* Typing canvas */}
        <MainCanvas
          targetText={targetText}
          userInput={userInput}
          errorIndex={errorIndex}
          isCompleted={isCompleted}
          isBlindMode={isBlindMode}
          onFocus={focusInput}
        />
      </main>

      {/* ── Floating Action Bar ─────────────────────────────────── */}
      <ActionFooter
        onRestart={restart}
        isBlindMode={isBlindMode}
        onToggleBlindMode={toggleBlindMode}
      />
    </div>
  );
}

export default App;
