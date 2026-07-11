import { useState, useEffect, useCallback, useRef } from "react";

// ── Snippet data ──────────────────────────────────────────────────────────────

export interface CodeToken {
  text: string;
  /** Tailwind color class for this token */
  colorClass: string;
}

export interface SnippetLine {
  lineNumber: number;
  tokens: CodeToken[];
}

export const SNIPPET_LINES: SnippetLine[] = [
  {
    lineNumber: 1,
    tokens: [
      { text: "def", colorClass: "text-[#c8a0f0] font-medium" },
      { text: " ", colorClass: "text-on-surface" },
      { text: "binary_search", colorClass: "text-primary" },
      { text: "(arr, target):", colorClass: "text-on-surface" },
    ],
  },
  {
    lineNumber: 2,
    tokens: [
      { text: "    left, right = 0, ", colorClass: "text-on-surface" },
      { text: "len", colorClass: "text-primary" },
      { text: "(arr) - 1", colorClass: "text-on-surface" },
    ],
  },
  {
    lineNumber: 3,
    tokens: [
      { text: "    ", colorClass: "text-on-surface" },
      { text: "while", colorClass: "text-[#c8a0f0]" },
      { text: " left <= right:", colorClass: "text-on-surface" },
    ],
  },
  {
    lineNumber: 4,
    tokens: [{ text: "        mid = (left + right) // 2", colorClass: "text-on-surface" }],
  },
  {
    lineNumber: 5,
    tokens: [
      { text: "        ", colorClass: "text-on-surface" },
      { text: "if", colorClass: "text-[#c8a0f0]" },
      { text: " arr[mid] == target:", colorClass: "text-on-surface" },
    ],
  },
  {
    lineNumber: 6,
    tokens: [
      { text: "            ", colorClass: "text-on-surface" },
      { text: "return", colorClass: "text-[#c8a0f0]" },
      { text: " mid", colorClass: "text-on-surface" },
    ],
  },
  {
    lineNumber: 7,
    tokens: [
      { text: "        ", colorClass: "text-on-surface" },
      { text: "elif", colorClass: "text-[#c8a0f0]" },
      { text: " arr[mid] < target:", colorClass: "text-on-surface" },
    ],
  },
  {
    lineNumber: 8,
    tokens: [{ text: "            left = mid + 1", colorClass: "text-on-surface" }],
  },
  {
    lineNumber: 9,
    tokens: [
      { text: "        ", colorClass: "text-on-surface" },
      { text: "else", colorClass: "text-[#c8a0f0]" },
      { text: ":", colorClass: "text-on-surface" },
    ],
  },
  {
    lineNumber: 10,
    tokens: [{ text: "            right = mid - 1", colorClass: "text-on-surface" }],
  },
];

/**
 * Flatten all tokens across all lines into a single string.
 * Lines are separated by "\n".
 */
function buildTargetText(lines: SnippetLine[]): string {
  return lines
    .map((line) => line.tokens.map((t) => t.text).join(""))
    .join("\n");
}

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
  /** Whether the user has started typing */
  isStarted: boolean;
  /** Whether the snippet is fully completed */
  isCompleted: boolean;
  /** Ref to the hidden textarea for focus management */
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  /** Call this to focus the input area */
  focusInput: () => void;
  /** Reset all state back to initial */
  restart: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useTypingEngine(): TypingEngineState {
  const targetText = buildTargetText(SNIPPET_LINES);

  const [userInput, setUserInput] = useState("");
  const [errorIndex, setErrorIndex] = useState(-1);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  /** Seconds elapsed from first keystroke to completion; 0 while still running */
  const [timeTaken, setTimeTaken] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  /** Timestamp (ms) of the very first keystroke */
  const startTimeRef = useRef<number | null>(null);
  /** Total attempted keystrokes (for accuracy denominator) */
  const totalAttemptsRef = useRef(0);
  /** Total correct keystrokes so far */
  const correctCharsRef = useRef(0);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  /**
   * Number of auto-inserted characters sitting ahead of the cursor.
   * When the user types a closing bracket/quote out of muscle memory,
   * we consume one skip token instead of registering the keystroke.
   */
  const autoSkipCountRef = useRef(0);

  // ── Stats updater ──────────────────────────────────────────────────────────

  const updateStats = useCallback(
    (correctCount: number, totalAttempts: number) => {
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

      // Accuracy: ratio of correct keystrokes to total keystrokes attempted.
      // Clamp strictly to [0, 100] — auto-inserts must never push this above 100.
      const rawAccuracy =
        totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 100;
      const newAccuracy = Math.min(100, Math.max(0, Math.round(rawAccuracy)));

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

      // IDE Smart Typing: Preserve progress and auto-indent
      if (e.key === 'Enter') {
        e.preventDefault();
        const lines = userInput.split('\n');
        const lastLine = lines[lines.length - 1] || '';
        const baseIndent = lastLine.match(/^\s*/)?.[0] || '';
        const extraIndent = lastLine.trim().endsWith(':') ? '    ' : '';
        
        setUserInput(prev => prev + '\n' + baseIndent + extraIndent);
        return; // stop execution here for Enter
      }

      // Ignore modifier-only combos (Ctrl+C, etc.) except Backspace
      if (
        e.key === "Tab" ||
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
          updateStats(newCorrect, totalAttemptsRef.current);

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
            // typed (1 attempt, 1 correct). The ghost closing char is free —
            // crediting 2 corrects for 1 attempt pushes accuracy above 100%.
            totalAttemptsRef.current += 1;
            correctCharsRef.current += 1;
            autoSkipCountRef.current += 1; // track one ghost closing char

            const nextInput = userInput + autoAppend;
            setUserInput(nextInput);
            setErrorIndex(-1);
            updateStats(correctCharsRef.current, totalAttemptsRef.current);

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
        totalAttemptsRef.current += 1;
        correctCharsRef.current += 1;

        const nextInput = userInput + typedChar;
        setUserInput(nextInput);
        setErrorIndex(-1);
        updateStats(correctCharsRef.current, totalAttemptsRef.current);

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
        totalAttemptsRef.current += 1;
        const nextInput = userInput + typedChar;
        setUserInput(nextInput);
        setErrorIndex(currentIdx);
        updateStats(correctCharsRef.current, totalAttemptsRef.current);
      }
    },
    [userInput, errorIndex, isStarted, isCompleted, targetText, updateStats]
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
    setIsStarted(false);
    setIsCompleted(false);
    startTimeRef.current = null;
    totalAttemptsRef.current = 0;
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
    isStarted,
    isCompleted,
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
