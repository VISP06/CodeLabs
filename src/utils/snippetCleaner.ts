interface LanguageRule {
  multiLineRegex: RegExp[];
  singleLineRegex: RegExp[];
  // Extra flags to strip boilerplate if needed later
  boilerplateRemover?: (code: string) => string;
}

// 1. Define cleaning rules for each language category
const languageRegistry: Record<string, LanguageRule> = {
  python: {
    multiLineRegex: [
      /"""[\s\S]*?"""/g, // Triple double quotes
      /'''[\s\S]*?'''/g  // Triple single quotes
    ],
    singleLineRegex: [/#.*$/gm]
  },
  // C-Style languages share the exact same comment patterns
  java: {
    multiLineRegex: [/\/\*[\s\S]*?\*\//g],
    singleLineRegex: [/\/\/.*$/gm],
    boilerplateRemover: (code: string) => stripJavaMainMethod(code)
  },
  cpp: {
    multiLineRegex: [/\/\*[\s\S]*?\*\//g],
    singleLineRegex: [/\/\/.*$/gm],
    boilerplateRemover: (code: string) => stripCppMainMethod(code)
  },
  c: {
    multiLineRegex: [/\/\*[\s\S]*?\*\//g],
    singleLineRegex: [/\/\/.*$/gm]
  }
};

// 2. Helper functions to clean out executable test boilerplate if present
function stripJavaMainMethod(code: string): string {
  // Strips standard public static void main blocks to keep only the core algorithm methods
  return code.replace(/public\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]\s*\w+\s*\)[\s\S]*?\}\s*(?=\n|\r|$)/g, '');
}

function stripCppMainMethod(code: string): string {
  // Strips standard int main() blocks
  return code.replace(/int\s+main\s*\([\s\S]*?\}\s*(?=\n|\r|$)/g, '');
}

// 3. The Main Exported Function
export function cleanCodeSnippet(rawCode: string, language: string): string {
  const normLang = language.toLowerCase();
  const rule = languageRegistry[normLang];

  // If the language isn't explicitly supported yet, return trimmed raw text safely
  if (!rule) {
    return rawCode.trim();
  }

  let cleaned = rawCode;

  // Execute all multi-line comment removals
  rule.multiLineRegex.forEach((regex) => {
    cleaned = cleaned.replace(regex, '');
  });

  // Execute all single-line comment removals
  rule.singleLineRegex.forEach((regex) => {
    cleaned = cleaned.replace(regex, '');
  });

  // Run optional boilerplate stripping (e.g., removing main methods)
  if (rule.boilerplateRemover) {
    cleaned = rule.boilerplateRemover(cleaned);
  }

  // Normalize formatting: Collapse 3+ consecutive newlines down to a single clean empty line
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');

  // Prevent giant long lines from breaking the typing layout
  // (Filter out lines that are excessively long if necessary)
  
  return cleaned.trim();
}