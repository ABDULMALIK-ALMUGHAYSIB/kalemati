import { Edit3 } from "lucide-react";
import { formatDate } from "../utils/helpers";
import { SpeakerButton } from "./SpeakerButton";

export function WordCard({ accent, entry, onEdit }) {
  return (
    <article className="word-card">
      <div className="word-card-header">
        <div className="word-card-title">
          <div className="word-title-row">
            <h2 className="word-title-chip">{entry.english}</h2>
            <SpeakerButton text={entry.english} accent={accent} />
          </div>
          <p className="word-translation" dir="rtl" lang="ar">{entry.arabic}</p>
        </div>
      </div>

      <div className="word-detail-list">
        {entry.example ? (
          <div className="word-detail">
            <span>Example</span>
            <p className="example">"{entry.example}"</p>
          </div>
        ) : null}
        {entry.meaning ? (
          <div className="word-detail">
            <span>Meaning</span>
            <p>{entry.meaning}</p>
          </div>
        ) : null}
        {entry.usage ? (
          <div className="word-detail">
            <span>Use</span>
            <p className="muted">{entry.usage}</p>
          </div>
        ) : null}
      </div>

      <div className="card-meta">
        <span>{entry.category}</span>
        <span>{formatDate(entry.dateAdded)}</span>
      </div>

      <div className="card-actions">
        <button type="button" onClick={onEdit}>
          <Edit3 size={17} />
          Edit
        </button>
      </div>
    </article>
  );
}
