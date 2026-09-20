import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Check, Sparkles } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { SpeakerButton } from "../components/SpeakerButton";
import { createStory, fetchStories, markStoryRead } from "../storyRepository";

const BATCH_SIZE = 10;

function sortByDateAddedAsc(entries) {
  return [...entries].sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
}

function chunkIntoBatches(entries, size) {
  const batches = [];
  for (let i = 0; i < entries.length; i += size) {
    batches.push(entries.slice(i, i + size));
  }
  return batches;
}

function normalizeWord(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z' ]/g, "");
}

function stemToken(token) {
  return token.replace(/(ing|ed|es|s)$/i, "");
}

function matchesTargetWord(boldText, target) {
  const boldTokens = normalizeWord(boldText).split(/\s+/).filter(Boolean).map(stemToken);
  const targetTokens = normalizeWord(target).split(/\s+/).filter(Boolean).map(stemToken);

  if (!boldTokens.length || boldTokens.length !== targetTokens.length) return false;

  return boldTokens.every((token, index) => {
    const targetToken = targetTokens[index];
    return token === targetToken || token.startsWith(targetToken) || targetToken.startsWith(token);
  });
}

function StoryText({ story, words, accent }) {
  const [openIndex, setOpenIndex] = useState(null);
  const parts = useMemo(() => story.split(/\*\*(.+?)\*\*/g), [story]);

  return (
    <p className="story-text">
      {parts.map((part, index) => {
        // Only highlight words that are actually in the batch — the model
        // occasionally bolds extra words that were never in the target list.
        const matchedWord =
          index % 2 === 1 ? words.find((word) => matchesTargetWord(part, word.english)) : null;

        if (!matchedWord) {
          return <span key={index}>{part}</span>;
        }

        const isOpen = openIndex === index;
        return (
          <span key={index} className="story-highlight-wrap">
            <button
              type="button"
              className="story-highlight"
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              {part}
            </button>
            {isOpen ? (
              <span className="story-highlight-card">
                <span dir="rtl" lang="ar">{matchedWord.arabic}</span>
                <SpeakerButton text={matchedWord.english} accent={accent} />
              </span>
            ) : null}
          </span>
        );
      })}
    </p>
  );
}

export function StoriesPage({ accent, entries, userId }) {
  const entryIdsKey = useMemo(() => entries.map((entry) => entry.id).sort().join("|"), [entries]);
  const batches = useMemo(
    () => chunkIntoBatches(sortByDateAddedAsc(entries), BATCH_SIZE).filter((batch) => batch.length === BATCH_SIZE),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entryIdsKey]
  );
  const remainder = entries.length % BATCH_SIZE;

  const [stories, setStories] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [storiesError, setStoriesError] = useState("");
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [creatingIndex, setCreatingIndex] = useState(null);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setStoriesLoading(true);

    fetchStories()
      .then((data) => {
        if (!cancelled) setStories(data);
      })
      .catch((error) => {
        if (!cancelled) setStoriesError(error.message || "Could not load your stories.");
      })
      .finally(() => {
        if (!cancelled) setStoriesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const storyByBatch = useMemo(() => new Map(stories.map((story) => [story.batchIndex, story])), [stories]);

  async function handleCreateStory(batchIndex, batch) {
    if (creatingIndex !== null) return;
    setCreatingIndex(batchIndex);
    setCreateError("");

    try {
      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          words: batch.map((entry) => ({ english: entry.english, arabic: entry.arabic }))
        })
      });

      const data = await response.json().catch(() => ({
        error: "Story endpoint is not returning JSON. Check the deployment API route."
      }));
      if (!response.ok) throw new Error(data.error || "Could not generate a story.");

      const saved = await createStory({
        userId,
        batchIndex,
        words: batch.map((entry) => ({ id: entry.id, english: entry.english, arabic: entry.arabic })),
        story: data.story,
        storyArabic: data.storyArabic
      });

      setStories((current) => [...current, saved]);
      setSelectedBatch(batchIndex);
    } catch (error) {
      setCreateError(error.message || "Could not create the story.");
    } finally {
      setCreatingIndex(null);
    }
  }

  async function handleMarkRead(story) {
    try {
      const updated = await markStoryRead(story.id);
      setStories((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch {
      // Not critical — the read flag is just a personal tracker.
    }
  }

  if (!entries.length) {
    return (
      <EmptyState
        icon={<BookOpen size={32} />}
        title="No stories yet"
        text="Save a few words first."
      />
    );
  }

  if (storiesLoading) {
    return <LoadingState text="Loading your stories..." />;
  }

  if (selectedBatch !== null) {
    const story = storyByBatch.get(selectedBatch);
    return (
      <StoryDetail
        accent={accent}
        batchIndex={selectedBatch}
        story={story}
        onMarkRead={() => handleMarkRead(story)}
        onBack={() => setSelectedBatch(null)}
      />
    );
  }

  return (
    <section className="page-stack">
      {storiesError ? <p className="error-note" role="alert">{storiesError}</p> : null}
      {createError ? <p className="error-note" role="alert">{createError}</p> : null}

      <div className="story-batch-grid">
        {batches.map((batch, index) => {
          const story = storyByBatch.get(index);
          const isCreating = creatingIndex === index;

          return (
            <button
              key={index}
              type="button"
              className="story-batch-card"
              disabled={isCreating}
              onClick={() => (story ? setSelectedBatch(index) : handleCreateStory(index, batch))}
            >
              {story ? <BookOpen size={20} /> : <Sparkles size={20} />}
              <span>
                Words {index * BATCH_SIZE + 1}–{index * BATCH_SIZE + BATCH_SIZE}
                <small>
                  {isCreating
                    ? "Creating story…"
                    : story
                    ? story.isRead
                      ? "Read"
                      : "Ready to read"
                    : "Tap to create a story"}
                </small>
              </span>
            </button>
          );
        })}
      </div>

      {remainder > 0 ? (
        <p className="inline-note">
          {remainder} of {BATCH_SIZE} words saved toward your next story.
        </p>
      ) : null}
    </section>
  );
}

function StoryDetail({ accent, batchIndex, story, onMarkRead, onBack }) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [showWordList, setShowWordList] = useState(false);

  return (
    <section className="page-stack">
      <button type="button" className="secondary-button story-back-button" onClick={onBack}>
        <ArrowLeft size={18} />
        Back to stories
      </button>

      <h2 className="story-batch-title">Story {batchIndex + 1}</h2>

      <article className="story-card">
        <StoryText story={story.story} words={story.words} accent={accent} />
        <button
          type="button"
          className="secondary-button story-translate-button"
          onClick={() => setShowTranslation((value) => !value)}
        >
          {showTranslation ? "Hide translation" : "Translate story"}
        </button>
        {showTranslation ? (
          <p className="story-text story-text-arabic" dir="rtl" lang="ar">
            {story.storyArabic}
          </p>
        ) : null}
      </article>

      <button
        type="button"
        className="secondary-button story-translate-button"
        onClick={() => setShowWordList((value) => !value)}
      >
        {showWordList ? "Hide word list" : "Show word list"}
      </button>

      {showWordList ? (
        <div className="story-word-list">
          {story.words.map((word) => (
            <article key={word.id || word.english} className="story-word-row">
              <div className="center-title-row">
                <strong>{word.english}</strong>
                <SpeakerButton text={word.english} accent={accent} />
              </div>
              <p dir="rtl" lang="ar">{word.arabic}</p>
            </article>
          ))}
        </div>
      ) : null}

      {story.isRead ? (
        <p className="inline-note story-read-note">
          <Check size={16} />
          You've marked this story as read.
        </p>
      ) : (
        <button type="button" className="primary-button" onClick={onMarkRead}>
          <Check size={18} />
          Mark as read
        </button>
      )}
    </section>
  );
}
