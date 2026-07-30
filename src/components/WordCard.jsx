import { useState } from "react";
import { ChevronDown, ChevronUp, Edit3 } from "lucide-react";
import { formatDate } from "../utils/helpers";
import { SpeakerButton } from "./SpeakerButton";

function ExpandableDetail({ label, text }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      type="button"
      className={`word-detail detail-toggle${expanded ? " expanded" : ""}`}
      onClick={() => setExpanded((value) => !value)}
      aria-expanded={expanded}
    >
      <div className="detail-toggle-label">
        <span>{label}</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </div>
      {expanded ? <p className="muted">{text}</p> : null}
    </button>
  );
}

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
        {entry.meaning ? <ExpandableDetail label="Meaning" text={entry.meaning} /> : null}
        {entry.usage ? <ExpandableDetail label="Use" text={entry.usage} /> : null}
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
