import { supabase } from '../lib/supabase'; // Adjust import to your supabase client
import { fetchSnippetFromGitHub } from './githubService';

export async function getOrFetchSnippet(query: string, language: string) {
    const normLang = language.toLowerCase();
  
  // 1. Check Supabase First (The Cache)
  const { data: cachedSnippet, error: cacheError } = await supabase
    .from('snippets')
    .select('*')
    // Use ilike for case-insensitive search
    .ilike('title', `%${query}%`)
    .eq('language', normLang)
    .maybeSingle();

  if (cacheError) {
    console.error("Cache read error:", cacheError);
  }

  // 2. If it exists in the database, return it instantly!
  if (cachedSnippet) {
    console.log("⚡ Fetched from Supabase Cache!");
    return cachedSnippet;
  }

  // 3. If not, fetch it from GitHub
  console.log("🌐 Not in cache. Fetching from GitHub...");
  const githubData = await fetchSnippetFromGitHub(query, normLang);

  // 4. Save the clean code back to Supabase so we never have to fetch it again
  const { error: insertError } = await supabase
    .from('snippets')
    .insert([{
      title: githubData.title,
      language: normLang,
      code: githubData.code,
      // You can also save the rawUrl if you want to link back to the source!
    }]);

  if (insertError) {
    console.error("Failed to cache snippet in Supabase:", insertError);
    // Even if the cache fails, we still return the code to the user so the UI doesn't break
  } else {
    console.log("💾 Successfully cached to Supabase!");
  }

  return githubData;
}

