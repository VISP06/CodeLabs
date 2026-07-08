import { useRef, useEffect } from "react";
import { SNIPPET_LINES, type SnippetLine } from "../hooks/useTypingEngine";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MainCanvasProps {
  userInput: string;
  /** Global flat index of the error; -1 = no error */
  errorIndex: number;
  isCompleted: boolean;
  onFocus: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// ── Character State ───────────────────────────────────────────────────────────

type CharState = "untyped" | "correct" | "error" | "cursor";

function getCharState(
  flatIdx: number,
  userInputLen: number,
  errorIndex: number
): CharState {
  if (flatIdx === userInputLen) return "cursor";
  if (flatIdx < userInputLen) {
    if (errorIndex !== -1 && flatIdx >= errorIndex) return "error";
    return "correct";
  }
  return "untyped";
}

// ── Per-character renderer ────────────────────────────────────────────────────

interface RenderChar {
  char: string;
  state: CharState;
  colorClass: string;
}

function buildRenderData(
  lines: SnippetLine[],
  userInput: string,
  errorIndex: number
): RenderChar[][] {
  const rendered: RenderChar[][] = lines.map(() => []);
  let flatIdx = 0;

  lines.forEach((line, li) => {
    line.tokens.forEach((token) => {
      for (let c = 0; c < token.text.length; c++) {
        const state = getCharState(flatIdx, userInput.length, errorIndex);
        rendered[li].push({
          char: token.text[c],
          state,
          colorClass: token.colorClass,
        });
        flatIdx++;
      }
    });

    // Skip the "\n" between lines
    if (li < lines.length - 1) {
      flatIdx++;
    }
  });

  // If cursor sits exactly at a newline boundary, mark the first char of next
  // line as cursor — already handled by flatIdx logic above.

  return rendered;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CharSpan({ rc, hasError }: { rc: RenderChar; hasError: boolean }) {
  if (rc.state === "cursor") {
    // Show the blinking cursor before the next untyped character
    const cursorClass = hasError
      ? "bg-error error-cursor shadow-[0_0_8px_rgba(255,107,107,0.8)]"
      : "bg-primary blinking-cursor shadow-[0_0_8px_rgba(125,211,252,0.8)]";
    return (
      <>
        <span
          className={`inline-block w-[3px] h-[1.2em] ${cursorClass} align-middle -translate-y-px`}
          aria-hidden="true"
        />
        <span className={`${rc.colorClass} opacity-[0.27]`}>{rc.char}</span>
      </>
    );
  }

  if (rc.state === "error") {
    return (
      <span className="text-error bg-error/10 rounded-[2px]">{rc.char}</span>
    );
  }

  if (rc.state === "correct") {
    return <span className={rc.colorClass}>{rc.char}</span>;
  }

  // untyped
  return (
    <span className={`${rc.colorClass} opacity-[0.27]`}>{rc.char}</span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MainCanvas({
  userInput,
  errorIndex,
  isCompleted,
  onFocus,
}: MainCanvasProps) {
  const renderData = buildRenderData(
    SNIPPET_LINES,
    userInput,
    errorIndex
  );

  // Cursor is at the end of userInput
  const cursorFlatIdx = userInput.length;

  // Determine which line the cursor is on (for the error cursor indicator)
  // We track if there's currently a red cursor state
  const hasError = errorIndex !== -1;

  // Scroll the cursor into view inside the canvas
  const cursorRef = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    cursorRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [cursorFlatIdx]);

  return (
    <div
      className="w-full max-w-[900px] flex-grow flex flex-col justify-center px-4 overflow-hidden relative mb-24"
      onClick={onFocus}
    >
      <div className="w-full glass rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-y-auto hide-scroll ring-1 ring-white/5">
        {/* ── Line Numbers ──────────────────────────────────────────────── */}
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 bottom-0 w-12 bg-white/5 border-r border-white/10 flex flex-col items-end py-6 sm:py-8 pr-3 font-mono text-xs sm:text-sm text-outline/40 select-none pointer-events-none"
        >
          {SNIPPET_LINES.map((line) => (
            <span key={line.lineNumber}>{line.lineNumber}</span>
          ))}
        </div>

        {/* ── Code Content ──────────────────────────────────────────────── */}
        <pre className="pl-12 sm:pl-16 font-mono text-lg sm:text-xl whitespace-pre-wrap break-words w-full h-full">
          <code className="language-python">
            {renderData.map((lineChars, li) => {
              // Check if the cursor sits at the newline *after* this line
              // (i.e. between this line and next). Flat index of that newline:
              let lineLen = 0;
              for (let i = 0; i <= li; i++) {
                lineLen += SNIPPET_LINES[i].tokens.reduce(
                  (s, t) => s + t.text.length,
                  0
                );
                if (i < li) lineLen += 1; // count preceding newlines
              }
              const newlineFlatIdx = lineLen; // index of "\n" after this line

              // Does the cursor sit at this newline position?
              const cursorOnNewline =
                !isCompleted &&
                userInput.length === newlineFlatIdx &&
                li < SNIPPET_LINES.length - 1;

              return (
                <span key={SNIPPET_LINES[li].lineNumber}>
                  {lineChars.map((rc, ci) => {
                    const isCursorHere =
                      !isCompleted &&
                      rc.state === "cursor";

                    return (
                      <span
                        key={ci}
                        ref={isCursorHere ? cursorRef : null}
                      >
                        <CharSpan rc={rc} hasError={hasError} />
                      </span>
                    );
                  })}

                  {/* Cursor sitting at end-of-line (before \n) */}
                  {cursorOnNewline && (
                    <span
                      ref={cursorRef}
                      className={`inline-block w-[3px] h-[1.2em] align-middle -translate-y-px blinking-cursor shadow-[0_0_8px_rgba(125,211,252,0.8)] ${
                        hasError
                          ? "bg-error shadow-[0_0_8px_rgba(255,107,107,0.8)]"
                          : "bg-primary"
                      }`}
                      aria-hidden="true"
                    />
                  )}

                  {/* Newline */}
                  {"\n"}
                </span>
              );
            })}
          </code>
        </pre>

        {/* Completion overlay */}
        {isCompleted && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/60 backdrop-blur-sm">
            <div className="text-center">
              <span className="text-4xl">🎉</span>
              <p className="mt-2 text-primary font-bold text-xl">
                Snippet Complete!
              </p>
              <p className="text-on-surface-variant text-sm mt-1">
                Press Restart to go again
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
