import { BookOpen, ClipboardList, Home, Library } from "lucide-react";

export function Navigation({ activePage, onNavigate }) {
  const items = [
    { id: "dashboard", label: "Home", icon: Home },
    { id: "list", label: "Words", icon: Library },
    { id: "review", label: "Stories", icon: BookOpen },
    { id: "lessons", label: "Lessons", icon: ClipboardList }
  ];

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className={activePage === id ? "active" : ""}
          onClick={() => onNavigate(id)}
        >
          <Icon size={20} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
