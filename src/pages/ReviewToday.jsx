import { useEffect, useMemo, useState } from "react";
import { BookOpen, Check } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { SpeakerButton } from "../components/SpeakerButton";
import { shuffle } from "../utils/helpers";

export function ReviewToday({ accent, entries, onUpdate }) {
  const entryIdsKey = useMemo(() => entries.map((entry) => entry.id).sort().join("|"), [entries]);
  const [reviewIds, setReviewIds] = useState([]);
  const [index, setIndex] = useState(0);
  const [answering, setAnswering] = useState(false);
  const entriesById = useMemo(
    () => new Map(entries.map((entry) => [entry.id, entry])),
    [entries]
  );
  const reviewItems = useMemo(
    () => reviewIds.map((id) => entriesById.get(id)).filter(Boolean),
    [entriesById, reviewIds]
  );
  const current = reviewItems[index];

  useEffect(() => {
    setReviewIds(shuffle(entries).slice(0, 10).map((entry) => entry.id));
    setIndex(0);
  }, [entryIdsKey]);

  async function answer(status) {
    if (!current || answering) return;
    setAnswering(true);

    try {
      await onUpdate(current.id, { status });
      setIndex((value) => Math.min(value + 1, reviewItems.length));
    } catch {
      // The app-level sync error explains the failure.
    } finally {
      setAnswering(false);
    }
  }

  if (!entries.length) {
    return (
      <EmptyState
        icon={<BookOpen size={32} />}
        title="Nothing to review"
        text="Save a few words first."
      />
    );
  }

  if (!reviewIds.length) {
    return <LoadingState text="Preparing your review..." />;
  }

  if (!current) {
    return (
      <section className="page-stack">
        <EmptyState
          icon={<Check size={32} />}
          title="Review complete"
          text="You finished today's review set."
        />
      </section>
    );
  }

  return (
    <section className="page-stack review-page">
      <p className="progress-label">
        {Math.min(index + 1, reviewItems.length)} of {reviewItems.length}
      </p>
      <article className="review-card">
        <span>{current.category}</span>
        <div className="center-title-row">
          <h2>{current.english}</h2>
          <SpeakerButton
            text={current.english}
            accent={accent}
            align="center"
          />
        </div>
        <p dir="rtl" lang="ar">{current.arabic}</p>
        {current.example ? <blockquote>{current.example}</blockquote> : null}
        {current.usage ? <p className="muted">{current.usage}</p> : null}
      </article>
      <div className="review-actions">
        <button type="button" onClick={() => answer("Mastered")} disabled={answering}>
          <Check size={20} />
          {answering ? "Saving..." : "I know it"}
        </button>
        <button type="button" onClick={() => answer("Learning")} disabled={answering}>
          <BookOpen size={20} />
          Still learning
        </button>
      </div>
    </section>
  );
}
