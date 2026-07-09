import { useRef, useEffect } from "react";
import { SNIPPET_LINES } from "../hooks/useTypingEngine";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MainCanvasProps {
  targetText: string;
  userInput: string;
  /** Global flat index of the error; -1 = no error */
  errorIndex: number;
  isCompleted: boolean;
  onFocus: () => void;
}

// Helper to precalculate color classes for flat target text character indices
const getCharStyle = (index: number): string => {
  let count = 0;
  for (let li = 0; li < SNIPPET_LINES.length; li++) {
    const line = SNIPPET_LINES[li];
    for (let ti = 0; ti < line.tokens.length; ti++) {
      const token = line.tokens[ti];
      if (index >= count && index < count + token.text.length) {
        return token.colorClass;
      }
      count += token.text.length;
    }
    // Newline character
    if (index === count) {
      return "";
    }
    count += 1; // For the newline character
  }
  return "";
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function MainCanvas({
  targetText,
  userInput,
  errorIndex,
  isCompleted,
  onFocus,
}: MainCanvasProps) {
  // Scroll the cursor into view inside the canvas
  const cursorRef = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    cursorRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [userInput.length]);

  const lines = targetText.split("\n");

  let globalCharIndex = 0; // Track the absolute index across lines

  return (
    <div
      className="w-full max-w-[900px] flex-grow flex flex-col justify-center px-4 overflow-hidden relative mb-24"
      onClick={onFocus}
    >
      <div className="w-full glass rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-y-auto hide-scroll ring-1 ring-white/5">
        <div className="flex flex-row gap-4 font-mono text-[16px]">
          {/* Left Column (Line Numbers) */}
          <div className="flex flex-col text-right select-none opacity-40 min-w-[3rem] border-r border-white/10 pr-4 mr-2">
            {lines.map((_, i) => (
              <span key={i}>{i + 1}</span>
            ))}
          </div>

          {/* Right Column (Code Text) */}
          <div className="flex flex-col relative">
            {/* Map over lines first */}
            {lines.map((line, lineIndex) => (
              <div key={lineIndex} className="flex flex-row whitespace-pre">
                {/* Map over characters in this specific line */}
                {line.split("").map((char) => {
                  const currentIndex = globalCharIndex++;
                  const isTyped = currentIndex < userInput.length;
                  const isCurrent = currentIndex === userInput.length;
                  const isError = isTyped && userInput[currentIndex] !== char;

                  const cursorColorClass = errorIndex !== -1 ? "border-red-500" : "border-[#7ae2ff]";

                  return (
                    <span
                      key={currentIndex}
                      ref={isCurrent ? cursorRef : undefined}
                      className={`
                        relative inline-block 
                        ${isError ? "text-red-500 bg-red-500/20" : isTyped ? "opacity-100" : "opacity-30"}
                        ${isCurrent ? `border-l-2 ${cursorColorClass} animate-blink` : "border-l-2 border-transparent"}
                        ${getCharStyle(currentIndex)}
                      `.trim()}
                    >
                      {char}
                    </span>
                  );
                })}
                {/* Handle the hidden newline character index at the end of each line */}
                {(() => {
                  const isCurrentNewline = globalCharIndex === userInput.length;
                  globalCharIndex++; // Increment for the \n character
                  const newlineCursorColorClass = errorIndex !== -1 ? "border-red-500" : "border-[#7ae2ff]";

                  return (
                    <span
                      ref={isCurrentNewline ? cursorRef : undefined}
                      className={`inline-block w-2 ${
                        isCurrentNewline ? `border-l-2 ${newlineCursorColorClass} animate-blink` : ""
                      }`}
                    >
                      &nbsp;
                    </span>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>

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
