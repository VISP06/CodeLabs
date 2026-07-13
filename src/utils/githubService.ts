import { cleanCodeSnippet } from './snippetCleaner';

// Map your app's language IDs to the exact GitHub repository names
const REPO_MAP: Record<string, string> = {
  python: 'TheAlgorithms/Python',
  java: 'TheAlgorithms/Java',
  cpp: 'TheAlgorithms/C-Plus-Plus',
  c: 'TheAlgorithms/C'
};

// Map your app's language IDs to their typical file extensions to ensure precise search results
const EXTENSION_MAP: Record<string, string> = {
  python: 'py',
  java: 'java',
  cpp: 'cpp',
  c: 'c'
};

interface FetchSnippetResult {
  title: string;
  code: string;
  rawUrl: string;
}

/**
 * Searches and fetches a clean algorithm snippet from TheAlgorithms repository
 */
export async function fetchSnippetFromGitHub(
  query: string, 
  language: string
): Promise<FetchSnippetResult> {
  const normLang = language.toLowerCase();
  const repo = REPO_MAP[normLang];
  const extension = EXTENSION_MAP[normLang];

  if (!repo) {
    throw new Error(`Language '${language}' is not currently mapped to a GitHub repository.`);
  }

  // 1. Search for the file matching the query within the specific repository
  // We filter by extension to avoid pulling documentation files or markdown files
  const searchQuery = encodeURIComponent(`${query} extension:${extension} repo:${repo}`);
  const searchUrl = `https://api.github.com/search/code?q=${searchQuery}`;

  const searchResponse = await fetch(searchUrl, {
    headers: {
      Accept: 'application/vnd.github+json',
      // Optional: If you hit rate limits during testing, add a GitHub PAT to your .env file:
      // Authorization: process.env.REACT_APP_GITHUB_TOKEN ? `Bearer ${process.env.REACT_APP_GITHUB_TOKEN}` : ''
    }
  });

  if (!searchResponse.ok) {
    if (searchResponse.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Please try again in a few minutes.');
    }
    throw new Error(`GitHub search failed with status: ${searchResponse.status}`);
  }

  const searchData = await searchResponse.json();

  if (!searchData.items || searchData.items.length === 0) {
    throw new Error(`No clean snippets found for "${query}" in ${language}.`);
  }

  // Pick the most relevant match (first item returned by GitHub's search relevance ranking)
  const bestMatch = searchData.items[0];
  const rawUrl = bestMatch.html_url
    .replace('github.com', 'raw.githubusercontent.com')
    .replace('/blob/', '/');

  // 2. Fetch the raw text contents of the code file
  const fileResponse = await fetch(rawUrl);
  if (!fileResponse.ok) {
    throw new Error(`Failed to fetch raw source code from GitHub storage.`);
  }

  const rawCode = await fileResponse.text();

  // 3. Process the snippet through your newly created scalable cleaner
  const cleanCode = cleanCodeSnippet(rawCode, normLang);

  // Derive a user-friendly title from the file name (e.g., "binary_search.py" -> "Binary Search")
  const derivedTitle = bestMatch.name
    .replace(`.${extension}`, '')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char: string) => char.toUpperCase());

  return {
    title: derivedTitle,
    code: cleanCode,
    rawUrl: rawUrl
  };
}