import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";

  return (
    <button
      className="theme-toggle"
      type="button"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={onToggle}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
      <span>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
