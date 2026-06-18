import { supabase } from "./supabaseClient";

const TABLE_NAME = "vocabulary_words";

function fromRow(row) {
  return {
    id: row.id,
    english: row.english,
    arabic: row.arabic_translation,
    meaning: row.simple_meaning || "",
    example: row.example_sentence || "",
    usage: row.when_to_use || "",
    category: row.category,
    status: row.status,
    dateAdded: row.date_added
  };
}

function toRow(entry, userId) {
  return {
    id: entry.id,
    user_id: userId,
    english: entry.english,
    arabic_translation: entry.arabic,
    simple_meaning: entry.meaning || "",
    example_sentence: entry.example || "",
    when_to_use: entry.usage || "",
    category: entry.category,
    status: entry.status,
    date_added: entry.dateAdded
  };
}

function toPatch(patch) {
  const row = {};

  if ("english" in patch) row.english = patch.english;
  if ("arabic" in patch) row.arabic_translation = patch.arabic;
  if ("meaning" in patch) row.simple_meaning = patch.meaning || "";
  if ("example" in patch) row.example_sentence = patch.example || "";
  if ("usage" in patch) row.when_to_use = patch.usage || "";
  if ("category" in patch) row.category = patch.category;
  if ("status" in patch) row.status = patch.status;
  if ("dateAdded" in patch) row.date_added = patch.dateAdded;

  return row;
}

function sortNewestFirst(entries) {
  return entries.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
}

export async function fetchWords() {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .order("date_added", { ascending: false });

  if (error) throw error;
  return (data || []).map(fromRow);
}

export async function createWord(entry, userId) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(toRow(entry, userId))
    .select()
    .single();

  if (error) throw error;
  return fromRow(data);
}

export async function updateWord(id, patch) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(toPatch(patch))
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return fromRow(data);
}

export async function deleteWord(id) {
  const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);
  if (error) throw error;
}

export async function upsertWords(entries, userId) {
  if (!entries.length) return [];

  const rows = entries.map((entry) => toRow(entry, userId));
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .upsert(rows, { onConflict: "id" })
    .select();

  if (error) throw error;
  return sortNewestFirst((data || []).map(fromRow));
}
