import { useMemo } from "react";
import { BookOpen, Plus } from "lucide-react";
import { StatCard } from "../components/StatCard";
import { todayKey } from "../utils/helpers";
import { isDue } from "../utils/srs";

export function Dashboard({ entries, onNavigate }) {
  const stats = useMemo(() => {
    const today = todayKey();
    return {
      total: entries.length,
      newWords: entries.filter((entry) => entry.status === "New").length,
      learning: entries.filter((entry) => entry.status === "Learning").length,
      mastered: entries.filter((entry) => entry.status === "Mastered").length,
      addedToday: entries.filter((entry) => todayKey(new Date(entry.dateAdded)) === today).length,
      dueToday: entries.filter((entry) => isDue(entry)).length
    };
  }, [entries]);

  return (
    <section className="page-stack">
      <div className="stats-grid">
        <StatCard label="Total saved" value={stats.total} tone="ink" />
        <StatCard label="New" value={stats.newWords} tone="blue" />
        <StatCard label="Learning" value={stats.learning} tone="amber" />
        <StatCard label="Mastered" value={stats.mastered} tone="green" />
      </div>

      <article className="today-panel">
        <div>
          <span>Added today</span>
          <strong>{stats.addedToday}</strong>
        </div>
        <button className="home-add-button" type="button" onClick={() => onNavigate("add")}>
          <span className="home-add-icon">
            <Plus size={18} />
          </span>
          <span>Add word</span>
        </button>
      </article>

      <button className="primary-button review-cta" type="button" onClick={() => onNavigate("review")}>
        <BookOpen size={20} />
        {stats.dueToday ? `Stories (${stats.dueToday} due)` : "Stories"}
      </button>
    </section>
  );
}
