import { useMemo, useState } from "react";
import { ClipboardList, Search } from "lucide-react";
import { CATEGORIES, STATUSES } from "../constants";
import { EmptyState } from "../components/EmptyState";
import { WordCard } from "../components/WordCard";

export function VocabularyList({ accent, entries, onEdit }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesSearch =
        !query ||
        entry.english.toLowerCase().includes(query) ||
        entry.arabic.toLowerCase().includes(query);
      const matchesCategory = category === "All" || entry.category === category;
      const matchesStatus = status === "All" || entry.status === status;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [entries, search, category, status]);

  return (
    <section className="page-stack">
      <div className="search-box">
        <Search size={18} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search English or Arabic"
        />
      </div>

      <div className="filter-row">
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option>All</option>
          {CATEGORIES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option>All</option>
          {STATUSES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>

      <div className="card-list">
        {filteredEntries.length ? (
          filteredEntries.map((entry) => (
            <WordCard
              key={entry.id}
              accent={accent}
              entry={entry}
              onEdit={() => onEdit(entry)}
            />
          ))
        ) : (
          <EmptyState
            icon={<ClipboardList size={30} />}
            title="No words found"
            text="Add a word or adjust your filters."
          />
        )}
      </div>

    </section>
  );
}
