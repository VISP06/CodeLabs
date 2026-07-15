import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import { useTypingEngine } from "./hooks/useTypingEngine";
import type { Language, SnippetLine } from "./data/snippets";
import { snippets, buildTargetText } from "./data/snippets";
import { getOrFetchSnippet } from "./utils/snippetService";
import Home from "./pages/Home";
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
  // ── View Router state ────────────────────────────────────────────────────────
  const [currentView, setCurrentView] = useState<"home" | "canvas">("home");

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

  // ── Language state ───────────────────────────────────────────────────────────
  const [activeLanguage, setActiveLanguage] = useState<Language>("python");

  // ── Snippet State ────────────────────────────────────────────────────────────
  const [targetText, setTargetText] = useState(() => buildTargetText(snippets["python"][0].lines));
  const [snippetTitle, setSnippetTitle] = useState(() => snippets["python"][0].title);
  const [snippetLines, setSnippetLines] = useState<SnippetLine[]>(() => snippets["python"][0].lines);

  useEffect(() => {
    const defaultSnip = snippets[activeLanguage][0];
    setTargetText(buildTargetText(defaultSnip.lines));
    setSnippetTitle(defaultSnip.title);
    setSnippetLines(defaultSnip.lines);
  }, [activeLanguage]);

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
    userInput,
    errorIndex,
    wpm,
    accuracy,
    timeTaken,
    liveTime,
    isCompleted,
    focusInput,
    restart,
  } = useTypingEngine(targetText);

  const handleSnippetFetch = (code: string, title: string) => {
    setTargetText(code);
    setSnippetTitle(title);
    setSnippetLines([]); // Fetched snippets don't have tokenized lines
    restart(); // Reset typing test states
  };

  // Handler for selecting an algorithm from the Home dashboard
  const handleSelectSnippetFromHome = async (title: string, lang: string) => {
    const mappedLang = (lang.toLowerCase() === "c++" ? "cpp" : lang.toLowerCase()) as Language;
    if (snippets[mappedLang]) {
      setActiveLanguage(mappedLang);
    }
    
    try {
      const result = await getOrFetchSnippet(title, mappedLang || activeLanguage);
      setTargetText(result.code);
      setSnippetTitle(result.title);
      setSnippetLines([]);
      restart();
    } catch (err) {
      console.error("Failed to load snippet from home dashboard:", err);
    }
    setCurrentView("canvas");
  };

  // Suppress the unused-variable lint warning for guestCompletions
  void guestCompletions;

  return (
    <div
      className="flex flex-col min-h-screen bg-background text-on-surface"
      onClick={currentView === "canvas" ? focusInput : undefined}
    >
      {/* Decorative ambient background glows */}
      <AmbientGlows />

      {/* View routing: Home Dashboard vs Typing Canvas */}
      {currentView === "home" ? (
        <Home onSelectSnippet={handleSelectSnippetFromHome} />
      ) : (
        <>
          {/* Sticky top header (with support to click logo/title to go back home) */}
          <Header
            snippetName={snippetTitle}
            session={session}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            activeLanguage={activeLanguage}
            onSnippetFetch={handleSnippetFetch}
            onGoHome={() => setCurrentView("home")}
          />

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
              liveTime={liveTime}
              snippetTitle={snippetTitle}
              snippetLines={snippetLines}
              onGuestComplete={handleGuestComplete}
              showPaywall={showPaywall}
              onClosePaywall={() => setShowPaywall(false)}
              activeLanguage={activeLanguage}
              setActiveLanguage={setActiveLanguage}
            />
          </main>

          {/* Fixed bottom action bar */}
          <ActionFooter
            onRestart={restart}
            isBlindMode={isBlindMode}
            onToggleBlindMode={() => setIsBlindMode((v) => !v)}
            onOpenLeaderboard={() => setShowLeaderboard(true)}
          />
        </>
      )}

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