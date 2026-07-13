import { useState, useEffect, useCallback, useRef } from "react";
import {
  type Language,
  type SnippetLine,
  snippets,
  buildTargetText,
} from "../data/snippets";

// ── Re-exports for consumers that still import from here ─────────────────────

export type { CodeToken, SnippetLine, Snippet, Language } from "../data/snippets";
export { snippets, buildTargetText, LANGUAGE_LABELS } from "../data/snippets";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TypingEngineState {
  targetText: string;
  userInput: string;
  /** Global index of the first error character; -1 if no error */
  errorIndex: number;
  /** WPM rounded to nearest integer */
  wpm: number;
  /** Accuracy percentage, 0-100 */
  accuracy: number;
  /** Elapsed time in seconds from first keystroke to completion (0 while running) */
  timeTaken: number;
  /** Live elapsed time in seconds, updated every 100ms while typing */
  liveTime: number;
  /** Whether the user has started typing */
  isStarted: boolean;
  /** Whether the snippet is fully completed */
  isCompleted: boolean;
  /** The active snippet lines (for syntax highlighting in MainCanvas) */
  snippetLines: SnippetLine[];
  /** Ref to the hidden textarea for focus management */
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  /** Call this to focus the input area */
  focusInput: () => void;
  /** Reset all state back to initial */
  restart: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useTypingEngine(activeLanguage: Language): TypingEngineState {
  // Pick the first snippet for the active language
  const activeSnippetLines = snippets[activeLanguage][0].lines;
  const targetText = buildTargetText(activeSnippetLines);

  const [userInput, setUserInput] = useState("");
  const [errorIndex, setErrorIndex] = useState(-1);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  /** Seconds elapsed from first keystroke to completion; 0 while still running */
  const [timeTaken, setTimeTaken] = useState(0);
  /** Live time that ticks while the user is typing */
  const [liveTime, setLiveTime] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  /** Timestamp (ms) of the very first keystroke */
  const startTimeRef = useRef<number | null>(null);
  /** Total correct keystrokes so far */
  const correctCharsRef = useRef(0);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  /**
   * Number of auto-inserted characters sitting ahead of the cursor.
   * When the user types a closing bracket/quote out of muscle memory,
   * we consume one skip token instead of registering the keystroke.
   */
  const autoSkipCountRef = useRef(0);

  // ── Live timer tick ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isStarted || isCompleted) return;

    const interval = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setLiveTime(Math.round(elapsed * 10) / 10);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isStarted, isCompleted]);

  // ── Reset when language changes ─────────────────────────────────────────────

  useEffect(() => {
    setUserInput("");
    setErrorIndex(-1);
    setWpm(0);
    setAccuracy(100);
    setTimeTaken(0);
    setLiveTime(0);
    setIsStarted(false);
    setIsCompleted(false);
    setErrorCount(0);
    startTimeRef.current = null;
    correctCharsRef.current = 0;
    autoSkipCountRef.current = 0;
  }, [activeLanguage]);

  // ── Stats updater ──────────────────────────────────────────────────────────

  const updateStats = useCallback(
    (correctCount: number, currentErrorCount: number) => {
      const now = Date.now();
      const elapsedMs = startTimeRef.current ? now - startTimeRef.current : 0;
      const elapsedMinutes = elapsedMs / 60_000;

      // Standard WPM: (correct chars / 5) / elapsed minutes
      // Guard against division-by-zero / Infinity / NaN on the very first ms
      const rawWpm =
        elapsedMinutes > 0 && correctCount > 0
          ? correctCount / 5 / elapsedMinutes
          : 0;
      const newWpm = Math.round(rawWpm);

      // Accuracy: based on correct keystrokes and cumulative error count
      const totalAttempts = correctCount + currentErrorCount;
      const newAccuracy = totalAttempts > 0 ? Math.floor((correctCount / totalAttempts) * 100) : 100;

      setWpm(newWpm);
      setAccuracy(newAccuracy);
    },
    []
  );

  // ── Keystroke handler ──────────────────────────────────────────────────────

  // ── Bracket / quote pairs ────────────────────────────────────────────────
  const OPEN_TO_CLOSE: Record<string, string> = {
    "(": ")",
    "[": "]",
    "{": "}",
    '"': '"',
    "'": "'",
  };

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      // Prevent spacebar page scroll while typing
      if (e.key === " " && isStarted) {
        e.preventDefault();
      }

      // Hijack the '/' key so it doesn't open the browser's Quick Find dialog
      if (e.key === '/') {
        e.stopPropagation(); 
      }

      // ── IDE Smart Typing: Tab inserts matching whitespace from target ────
      if (e.key === 'Tab') {
        e.preventDefault();
        if (isCompleted || errorIndex !== -1) return;

        const currentIdx = userInput.length;
        if (currentIdx >= targetText.length) return;

        // Collect all upcoming whitespace (spaces/tabs) from the target
        let advanceEnd = currentIdx;
        while (
          advanceEnd < targetText.length &&
          (targetText[advanceEnd] === ' ' || targetText[advanceEnd] === '\t')
        ) {
          advanceEnd++;
        }

        // Only act if there is actually whitespace to skip
        if (advanceEnd === currentIdx) return;

        const inserted = targetText.slice(currentIdx, advanceEnd);

        // Start timer on first keystroke
        if (!isStarted) {
          startTimeRef.current = Date.now();
          setIsStarted(true);
        }

        // Credit every auto-inserted char as 1 correct
        correctCharsRef.current += inserted.length;

        const nextInput = userInput + inserted;
        setUserInput(nextInput);
        setErrorIndex(-1);
        updateStats(correctCharsRef.current, errorCount);

        if (nextInput.length === targetText.length) {
          setIsCompleted(true);
          if (startTimeRef.current) {
            const elapsedSec = (Date.now() - startTimeRef.current) / 1000;
            setTimeTaken(Math.round(elapsedSec * 10) / 10);
          }
        }
        return;
      }

      // ── IDE Smart Typing: Enter inserts newline + auto-indent from target ─
      if (e.key === 'Enter') {
        e.preventDefault();
        if (isCompleted || errorIndex !== -1) return;

        const currentIdx = userInput.length;
        if (currentIdx >= targetText.length) return;

        // The next character in the target must be a newline for Enter to work
        if (targetText[currentIdx] !== '\n') return;

        // Collect the newline + all leading whitespace on the following line
        let advanceEnd = currentIdx + 1; // past the '\n'
        while (
          advanceEnd < targetText.length &&
          (targetText[advanceEnd] === ' ' || targetText[advanceEnd] === '\t')
        ) {
          advanceEnd++;
        }

        const inserted = targetText.slice(currentIdx, advanceEnd);

        // Start timer on first keystroke
        if (!isStarted) {
          startTimeRef.current = Date.now();
          setIsStarted(true);
        }

        // Credit every auto-inserted char as 1 correct
        correctCharsRef.current += inserted.length;

        const nextInput = userInput + inserted;
        setUserInput(nextInput);
        setErrorIndex(-1);
        updateStats(correctCharsRef.current, errorCount);

        if (nextInput.length === targetText.length) {
          setIsCompleted(true);
          if (startTimeRef.current) {
            const elapsedSec = (Date.now() - startTimeRef.current) / 1000;
            setTimeTaken(Math.round(elapsedSec * 10) / 10);
          }
        }
        return;
      }

      // Ignore modifier-only combos (Ctrl+C, etc.) except Backspace
      if (
        (e.ctrlKey && e.key !== "Backspace") ||
        (e.altKey && e.key !== "Backspace") ||
        (e.metaKey && e.key !== "Backspace")
      ) {
        e.preventDefault();
        return;
      }

      if (isCompleted) return;

      // ── Backspace ──────────────────────────────────────────────────────────
      if (e.key === "Backspace") {
        // If there are auto-skipped characters ahead, remove them first
        autoSkipCountRef.current = 0;
        setUserInput((prev) => {
          if (prev.length === 0) return prev;
          const next = prev.slice(0, -1);

          // Re-check error after deletion
          const newErrorIdx = findFirstError(next, targetText);
          setErrorIndex(newErrorIdx);

          // Recalculate correct chars
          const newCorrect = countCorrect(next, targetText);
          correctCharsRef.current = newCorrect;
          updateStats(newCorrect, errorCount);

          return next;
        });
        return;
      }

      // ── Ignore if there's an unresolved error ─────────────────────────────
      if (errorIndex !== -1) return;

      // ── Only handle printable single characters and Enter ─────────────────
      if (e.key.length !== 1 && e.key !== "Enter") return;

      const typedChar = e.key;
      const currentIdx = userInput.length;

      if (currentIdx >= targetText.length) return; // Already at end

      // ── Smart closing-bracket skip (muscle-memory guard) ─────────────────
      // If the user types a closing character and we have auto-inserted chars
      // sitting ahead, silently consume one skip token and do nothing else.
      const closingChars = new Set(Object.values(OPEN_TO_CLOSE));
      if (autoSkipCountRef.current > 0 && closingChars.has(typedChar)) {
        autoSkipCountRef.current -= 1;
        e.preventDefault();
        return;
      }

      // Start timer on first keystroke
      if (!isStarted) {
        startTimeRef.current = Date.now();
        setIsStarted(true);
      }

      const expectedChar = targetText[currentIdx];
      const isCorrect = typedChar === expectedChar;

      if (isCorrect) {

        // ── Smart Bracket / Quote Auto-close ─────────────────────────────────
        const closingChar = OPEN_TO_CLOSE[typedChar];
        if (closingChar !== undefined) {
          const nextCharInTarget = targetText[currentIdx + 1];
          if (nextCharInTarget === closingChar) {
            // Auto-insert both the opening and closing character
            const autoAppend = typedChar + closingChar;

            // ACCURACY FIX: Count only the opening bracket the user physically
            // typed (1 correct). The ghost closing char is free.
            correctCharsRef.current += 1;
            autoSkipCountRef.current += 1; // track one ghost closing char

            const nextInput = userInput + autoAppend;
            setUserInput(nextInput);
            setErrorIndex(-1);
            updateStats(correctCharsRef.current, errorCount);

            if (nextInput.length === targetText.length) {
              setIsCompleted(true);
              // Capture elapsed time once at the moment the snippet is completed
              if (startTimeRef.current) {
                const elapsedSec = (Date.now() - startTimeRef.current) / 1000;
                setTimeTaken(Math.round(elapsedSec * 10) / 10);
              }
            }
            return;
          }
        }

        // ── Normal correct keystroke ──────────────────────────────────────────
        correctCharsRef.current += 1;

        const nextInput = userInput + typedChar;
        setUserInput(nextInput);
        setErrorIndex(-1);
        updateStats(correctCharsRef.current, errorCount);

        if (nextInput.length === targetText.length) {
          setIsCompleted(true);
          // Capture elapsed time once at the moment the snippet is completed
          if (startTimeRef.current) {
            const elapsedSec = (Date.now() - startTimeRef.current) / 1000;
            setTimeTaken(Math.round(elapsedSec * 10) / 10);
          }
        }
      } else {
        // ── Incorrect keystroke ───────────────────────────────────────────────
        const newErrorCount = errorCount + 1;
        setErrorCount(newErrorCount);
        const nextInput = userInput + typedChar;
        setUserInput(nextInput);
        setErrorIndex(currentIdx);
        updateStats(correctCharsRef.current, newErrorCount);
      }
    },
    [userInput, errorCount, errorIndex, isStarted, isCompleted, targetText, updateStats]
  );

  // ── Mount global listener ──────────────────────────────────────────────────

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // ── Restart ────────────────────────────────────────────────────────────────

  const restart = useCallback(() => {
    setUserInput("");
    setErrorIndex(-1);
    setWpm(0);
    setAccuracy(100);
    setTimeTaken(0);
    setLiveTime(0);
    setIsStarted(false);
    setIsCompleted(false);
    setErrorCount(0);
    startTimeRef.current = null;
    correctCharsRef.current = 0;
    autoSkipCountRef.current = 0;
    inputRef.current?.focus();
  }, []);

  // ── Focus helper ───────────────────────────────────────────────────────────

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return {
    targetText,
    userInput,
    errorIndex,
    wpm,
    accuracy,
    timeTaken,
    liveTime,
    isStarted,
    isCompleted,
    snippetLines: activeSnippetLines,
    inputRef,
    focusInput,
    restart,
  };
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

/** Returns the index of the first mismatched character, or -1 if all match */
function findFirstError(input: string, target: string): number {
  for (let i = 0; i < input.length; i++) {
    if (input[i] !== target[i]) return i;
  }
  return -1;
}

/** Count how many characters in `input` match `target` at the same position */
function countCorrect(input: string, target: string): number {
  let count = 0;
  for (let i = 0; i < input.length; i++) {
    if (input[i] === target[i]) count++;
  }
  return count;
}
