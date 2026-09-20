import { supabase } from "./supabaseClient";

const TABLE_NAME = "word_stories";

function fromRow(row) {
  return {
    id: row.id,
    batchIndex: row.batch_index,
    words: row.words,
    story: row.story,
    storyArabic: row.story_arabic,
    isRead: row.is_read,
    createdAt: row.created_at
  };
}

export async function fetchStories() {
  const { data, error } = await supabase.from(TABLE_NAME).select("*");
  if (error) throw error;
  return (data || []).map(fromRow);
}

export async function createStory({ userId, batchIndex, words, story, storyArabic }) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert({
      user_id: userId,
      batch_index: batchIndex,
      words,
      story,
      story_arabic: storyArabic
    })
    .select()
    .single();

  if (error) throw error;
  return fromRow(data);
}

export async function markStoryRead(id) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({ is_read: true })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return fromRow(data);
}
