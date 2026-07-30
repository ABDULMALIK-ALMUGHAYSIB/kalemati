import { ACCENTS, ACCENT_KEY, THEME_KEY } from "../constants";

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function loadTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || "light";
  } catch {
    return "light";
  }
}

export function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

export function loadAccent() {
  try {
    const storedAccent = localStorage.getItem(ACCENT_KEY);
    return ACCENTS.some((accent) => accent.value === storedAccent) ? storedAccent : "en-US";
  } catch {
    return "en-US";
  }
}

export function saveAccent(accent) {
  localStorage.setItem(ACCENT_KEY, accent);
}

export function containsArabic(value) {
  return /[؀-ۿ]/.test(value);
}

export function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

export function normalizeArabic(value) {
  return value.trim().replace(/\s+/g, "").toLowerCase();
}

export function pageTitle(page) {
  return {
    dashboard: "Dashboard",
    add: "Add Word",
    list: "Vocabulary",
    review: "Review Today",
    quiz: "Quiz",
    lessons: "Lessons"
  }[page];
}
