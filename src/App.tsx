import "./index.css";
import { useState } from "react";

import Header from "./components/Header";
import MobileContextBar from "./components/MobileContextBar";
import LanguageDropdown from "./components/LanguageDropdown";
import MainCanvas from "./components/MainCanvas";
import ActionFooter from "./components/ActionFooter";
import AmbientGlows from "./components/AmbientGlows";
import { useTypingEngine } from "./hooks/useTypingEngine";

/**
 * App — Phase 2 Typing Engine
 *
 * Wires the useTypingEngine hook into all layout components.
 * State flows down as props; no global store needed.
 */
function App() {
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
      <ActionFooter onRestart={restart} isBlindMode={isBlindMode} onToggleBlindMode={toggleBlindMode} />
    </div>
  );
}

export default App;
