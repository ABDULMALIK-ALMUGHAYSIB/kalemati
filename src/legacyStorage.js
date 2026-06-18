import { previousWords } from "./previousWords";

export const STORAGE_KEY = "wordvault.entries.v1";
const PREVIOUS_WORDS_IMPORT_KEY = "wordvault.previousWordsImported.v1";
const SUPABASE_MIGRATION_KEY = "kalemati.supabaseMigration.v1";

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function uniqueByEnglish(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    const key = entry.english?.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function loadLegacyEntries() {
  const storedEntries = safeJsonParse(localStorage.getItem(STORAGE_KEY), []);
  const shouldIncludePreviousWords =
    localStorage.getItem(PREVIOUS_WORDS_IMPORT_KEY) !== "true";
  const importDate = new Date().toISOString();
  const previousEntries = shouldIncludePreviousWords
    ? previousWords.map((word) => ({
        ...word,
        id: crypto.randomUUID(),
        dateAdded: importDate
      }))
    : [];

  return uniqueByEnglish([...storedEntries, ...previousEntries]).map((entry) => ({
    ...entry,
    id: entry.id || crypto.randomUUID(),
    dateAdded: entry.dateAdded || importDate
  }));
}

export function hasMigratedLegacyEntries(userId) {
  return localStorage.getItem(`${SUPABASE_MIGRATION_KEY}.${userId}`) === "true";
}

export function markLegacyEntriesMigrated(userId) {
  localStorage.setItem(`${SUPABASE_MIGRATION_KEY}.${userId}`, "true");
}
