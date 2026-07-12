// ── Snippet token types ───────────────────────────────────────────────────────

export interface CodeToken {
  text: string;
  /** Tailwind color class for this token */
  colorClass: string;
}

export interface SnippetLine {
  lineNumber: number;
  tokens: CodeToken[];
}

export interface Snippet {
  title: string;
  lines: SnippetLine[];
}

// ── Language keys ─────────────────────────────────────────────────────────────

export type Language = "python" | "cpp" | "java";

export const LANGUAGE_LABELS: Record<Language, string> = {
  python: "Python",
  cpp: "C++",
  java: "Java",
};

// ── Snippet data by language ──────────────────────────────────────────────────

export const snippets: Record<Language, Snippet[]> = {
  // ── Python ──────────────────────────────────────────────────────────────────
  python: [
    {
      title: "Binary Search",
      lines: [
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
      ],
    },
  ],

  // ── C++ ─────────────────────────────────────────────────────────────────────
  cpp: [
    {
      title: "Binary Search",
      lines: [
        {
          lineNumber: 1,
          tokens: [
            { text: "int", colorClass: "text-[#c8a0f0] font-medium" },
            { text: " ", colorClass: "text-on-surface" },
            { text: "binarySearch", colorClass: "text-primary" },
            { text: "(vector<int>& arr, ", colorClass: "text-on-surface" },
            { text: "int", colorClass: "text-[#c8a0f0] font-medium" },
            { text: " target) {", colorClass: "text-on-surface" },
          ],
        },
        {
          lineNumber: 2,
          tokens: [
            { text: "    ", colorClass: "text-on-surface" },
            { text: "int", colorClass: "text-[#c8a0f0] font-medium" },
            { text: " left = 0, right = arr.", colorClass: "text-on-surface" },
            { text: "size", colorClass: "text-primary" },
            { text: "() - 1;", colorClass: "text-on-surface" },
          ],
        },
        {
          lineNumber: 3,
          tokens: [
            { text: "    ", colorClass: "text-on-surface" },
            { text: "while", colorClass: "text-[#c8a0f0]" },
            { text: " (left <= right) {", colorClass: "text-on-surface" },
          ],
        },
        {
          lineNumber: 4,
          tokens: [
            { text: "        ", colorClass: "text-on-surface" },
            { text: "int", colorClass: "text-[#c8a0f0] font-medium" },
            { text: " mid = left + (right - left) / 2;", colorClass: "text-on-surface" },
          ],
        },
        {
          lineNumber: 5,
          tokens: [
            { text: "        ", colorClass: "text-on-surface" },
            { text: "if", colorClass: "text-[#c8a0f0]" },
            { text: " (arr[mid] == target)", colorClass: "text-on-surface" },
          ],
        },
        {
          lineNumber: 6,
          tokens: [
            { text: "            ", colorClass: "text-on-surface" },
            { text: "return", colorClass: "text-[#c8a0f0]" },
            { text: " mid;", colorClass: "text-on-surface" },
          ],
        },
        {
          lineNumber: 7,
          tokens: [
            { text: "        ", colorClass: "text-on-surface" },
            { text: "else if", colorClass: "text-[#c8a0f0]" },
            { text: " (arr[mid] < target)", colorClass: "text-on-surface" },
          ],
        },
        {
          lineNumber: 8,
          tokens: [{ text: "            left = mid + 1;", colorClass: "text-on-surface" }],
        },
        {
          lineNumber: 9,
          tokens: [
            { text: "        ", colorClass: "text-on-surface" },
            { text: "else", colorClass: "text-[#c8a0f0]" },
          ],
        },
        {
          lineNumber: 10,
          tokens: [{ text: "            right = mid - 1;", colorClass: "text-on-surface" }],
        },
        {
          lineNumber: 11,
          tokens: [{ text: "    }", colorClass: "text-on-surface" }],
        },
        {
          lineNumber: 12,
          tokens: [
            { text: "    ", colorClass: "text-on-surface" },
            { text: "return", colorClass: "text-[#c8a0f0]" },
            { text: " -1;", colorClass: "text-on-surface" },
          ],
        },
        {
          lineNumber: 13,
          tokens: [{ text: "}", colorClass: "text-on-surface" }],
        },
      ],
    },
  ],

  // ── Java ────────────────────────────────────────────────────────────────────
  java: [
    {
      title: "Binary Search",
      lines: [
        {
          lineNumber: 1,
          tokens: [
            { text: "public static", colorClass: "text-[#c8a0f0] font-medium" },
            { text: " ", colorClass: "text-on-surface" },
            { text: "int", colorClass: "text-[#c8a0f0] font-medium" },
            { text: " ", colorClass: "text-on-surface" },
            { text: "binarySearch", colorClass: "text-primary" },
            { text: "(int[] arr, ", colorClass: "text-on-surface" },
            { text: "int", colorClass: "text-[#c8a0f0] font-medium" },
            { text: " target) {", colorClass: "text-on-surface" },
          ],
        },
        {
          lineNumber: 2,
          tokens: [
            { text: "    ", colorClass: "text-on-surface" },
            { text: "int", colorClass: "text-[#c8a0f0] font-medium" },
            { text: " left = 0, right = arr.length - 1;", colorClass: "text-on-surface" },
          ],
        },
        {
          lineNumber: 3,
          tokens: [
            { text: "    ", colorClass: "text-on-surface" },
            { text: "while", colorClass: "text-[#c8a0f0]" },
            { text: " (left <= right) {", colorClass: "text-on-surface" },
          ],
        },
        {
          lineNumber: 4,
          tokens: [
            { text: "        ", colorClass: "text-on-surface" },
            { text: "int", colorClass: "text-[#c8a0f0] font-medium" },
            { text: " mid = left + (right - left) / 2;", colorClass: "text-on-surface" },
          ],
        },
        {
          lineNumber: 5,
          tokens: [
            { text: "        ", colorClass: "text-on-surface" },
            { text: "if", colorClass: "text-[#c8a0f0]" },
            { text: " (arr[mid] == target)", colorClass: "text-on-surface" },
          ],
        },
        {
          lineNumber: 6,
          tokens: [
            { text: "            ", colorClass: "text-on-surface" },
            { text: "return", colorClass: "text-[#c8a0f0]" },
            { text: " mid;", colorClass: "text-on-surface" },
          ],
        },
        {
          lineNumber: 7,
          tokens: [
            { text: "        ", colorClass: "text-on-surface" },
            { text: "else if", colorClass: "text-[#c8a0f0]" },
            { text: " (arr[mid] < target)", colorClass: "text-on-surface" },
          ],
        },
        {
          lineNumber: 8,
          tokens: [{ text: "            left = mid + 1;", colorClass: "text-on-surface" }],
        },
        {
          lineNumber: 9,
          tokens: [
            { text: "        ", colorClass: "text-on-surface" },
            { text: "else", colorClass: "text-[#c8a0f0]" },
          ],
        },
        {
          lineNumber: 10,
          tokens: [{ text: "            right = mid - 1;", colorClass: "text-on-surface" }],
        },
        {
          lineNumber: 11,
          tokens: [{ text: "    }", colorClass: "text-on-surface" }],
        },
        {
          lineNumber: 12,
          tokens: [
            { text: "    ", colorClass: "text-on-surface" },
            { text: "return", colorClass: "text-[#c8a0f0]" },
            { text: " -1;", colorClass: "text-on-surface" },
          ],
        },
        {
          lineNumber: 13,
          tokens: [{ text: "}", colorClass: "text-on-surface" }],
        },
      ],
    },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Flatten all tokens across all lines into a single string.
 * Lines are separated by "\n".
 */
export function buildTargetText(lines: SnippetLine[]): string {
  return lines
    .map((line) => line.tokens.map((t) => t.text).join(""))
    .join("\n");
}
