import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { SpeakerButton } from "../components/SpeakerButton";
import { STORY_BATCHES } from "../data/storyBatches";
import { loadCachedStory, saveCachedStory } from "../utils/helpers";

function normalizeKey(value) {
  return value.trim().toLowerCase();
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

function StoryText({ story, batch, accent }) {
  const [openIndex, setOpenIndex] = useState(null);
  const parts = useMemo(() => story.split(/\*\*(.+?)\*\*/g), [story]);

  return (
    <p className="story-text">
      {parts.map((part, index) => {
        // Only highlight words that are actually in the batch — the model
        // occasionally bolds extra words that were never in the target list.
        const matchedEntry =
          index % 2 === 1 ? batch.find((entry) => matchesTargetWord(part, entry.english)) : null;

        if (!matchedEntry) {
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
                <span dir="rtl" lang="ar">{matchedEntry.arabic}</span>
                <SpeakerButton text={matchedEntry.english} accent={accent} />
              </span>
            ) : null}
          </span>
        );
      })}
    </p>
  );
}

export function StoriesPage({ accent, entries }) {
  const entryIdsKey = useMemo(() => entries.map((entry) => entry.id).sort().join("|"), [entries]);
  const batches = useMemo(() => {
    const byKey = new Map(entries.map((entry) => [normalizeKey(entry.english), entry]));
    return STORY_BATCHES.map((batch) => ({
      title: batch.title,
      entries: batch.words.map((word) => byKey.get(normalizeKey(word))).filter(Boolean)
    })).filter((batch) => batch.entries.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryIdsKey]);
  const [selectedBatch, setSelectedBatch] = useState(null);

  if (!entries.length) {
    return (
      <EmptyState
        icon={<BookOpen size={32} />}
        title="No stories yet"
        text="Save a few words first."
      />
    );
  }

  if (selectedBatch === null) {
    return (
      <section className="page-stack">
        <div className="story-batch-grid">
          {batches.map((batch, index) => (
            <button
              key={batch.title}
              type="button"
              className="story-batch-card"
              onClick={() => setSelectedBatch(index)}
            >
              <BookOpen size={20} />
              <span>
                {batch.title}
                <small>{batch.entries.length} words</small>
              </span>
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <StoryDetail
      accent={accent}
      title={batches[selectedBatch].title}
      batch={batches[selectedBatch].entries}
      onBack={() => setSelectedBatch(null)}
    />
  );
}

function StoryDetail({ accent, title, batch, onBack }) {
  const batchKey = useMemo(() => batch.map((entry) => entry.id).join("|"), [batch]);
  const [story, setStory] = useState(null);
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyError, setStoryError] = useState("");
  const [showTranslation, setShowTranslation] = useState(false);
  const [showWordList, setShowWordList] = useState(false);

  useEffect(() => {
    setShowTranslation(false);
    setShowWordList(false);

    const cached = loadCachedStory(batchKey);
    if (cached) {
      setStory(cached);
      setStoryError("");
      return undefined;
    }

    let cancelled = false;
    setStory(null);
    setStoryLoading(true);
    setStoryError("");

    fetch("/api/generate-story", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        words: batch.map((entry) => ({ english: entry.english, arabic: entry.arabic }))
      })
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({
          error: "Story endpoint is not returning JSON. Check the deployment API route."
        }));
        if (!response.ok) throw new Error(data.error || "Could not generate a story.");
        if (!cancelled) {
          setStory(data);
          saveCachedStory(batchKey, data);
        }
      })
      .catch((error) => {
        if (!cancelled) setStoryError(error.message || "Could not generate a story.");
      })
      .finally(() => {
        if (!cancelled) setStoryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [batchKey]);

  return (
    <section className="page-stack">
      <button type="button" className="secondary-button story-back-button" onClick={onBack}>
        <ArrowLeft size={18} />
        Back to stories
      </button>

      <h2 className="story-batch-title">{title}</h2>

      <article className="story-card">
        {storyLoading ? <LoadingState text="Writing your story..." /> : null}
        {storyError ? <p className="error-note" role="alert">{storyError}</p> : null}
        {story ? (
          <>
            <StoryText story={story.story} batch={batch} accent={accent} />
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
          </>
        ) : null}
      </article>

      {story ? (
        <>
          <button
            type="button"
            className="secondary-button story-translate-button"
            onClick={() => setShowWordList((value) => !value)}
          >
            {showWordList ? "Hide word list" : "Show word list"}
          </button>
          {showWordList ? (
            <div className="story-word-list">
              {batch.map((entry) => (
                <article key={entry.id} className="story-word-row">
                  <div className="center-title-row">
                    <strong>{entry.english}</strong>
                    <SpeakerButton text={entry.english} accent={accent} />
                  </div>
                  <p dir="rtl" lang="ar">{entry.arabic}</p>
                </article>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
