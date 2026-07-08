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
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  /** Timestamp (ms) of the very first keystroke */
  const startTimeRef = useRef<number | null>(null);
  /** Total attempted keystrokes (for accuracy denominator) */
  const totalAttemptsRef = useRef(0);
  /** Total correct keystrokes so far */
  const correctCharsRef = useRef(0);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // ── Stats updater ──────────────────────────────────────────────────────────

  const updateStats = useCallback(
    (correctCount: number, totalAttempts: number) => {
      const now = Date.now();
      const elapsedMs = startTimeRef.current ? now - startTimeRef.current : 0;
      const elapsedMinutes = elapsedMs / 60_000;

      const newWpm =
        elapsedMinutes > 0
          ? Math.round(correctCount / 5 / elapsedMinutes)
          : 0;

      const newAccuracy =
        totalAttempts > 0
          ? Math.round((correctCount / totalAttempts) * 100)
          : 100;

      setWpm(newWpm);
      setAccuracy(newAccuracy);
    },
    []
  );

  // ── Keystroke handler ──────────────────────────────────────────────────────

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      // Prevent spacebar page scroll while typing
      if (e.key === " " && isStarted) {
        e.preventDefault();
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

      const typedChar = e.key === "Enter" ? "\n" : e.key;
      const currentIdx = userInput.length;

      if (currentIdx >= targetText.length) return; // Already at end

      // Start timer on first keystroke
      if (!isStarted) {
        startTimeRef.current = Date.now();
        setIsStarted(true);
      }

      // Count this as an attempt
      totalAttemptsRef.current += 1;

      const expectedChar = targetText[currentIdx];
      const isCorrect = typedChar === expectedChar;

      const nextInput = userInput + typedChar;
      setUserInput(nextInput);

      if (isCorrect) {
        correctCharsRef.current += 1;
        setErrorIndex(-1);

        // Check completion
        if (nextInput.length === targetText.length) {
          setIsCompleted(true);
        }
      } else {
        setErrorIndex(currentIdx);
      }

      updateStats(correctCharsRef.current, totalAttemptsRef.current);
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
    setIsStarted(false);
    setIsCompleted(false);
    startTimeRef.current = null;
    totalAttemptsRef.current = 0;
    correctCharsRef.current = 0;
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
