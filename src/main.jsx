import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BookOpen,
  Brain,
  Check,
  ClipboardList,
  Edit3,
  Home,
  Library,
  LoaderCircle,
  LogOut,
  Moon,
  Plus,
  Save,
  Search,
  Sparkles,
  Sun,
  Trash2,
  X
} from "lucide-react";
import {
  cleanupDuplicateWords,
  createWord,
  deleteWord,
  fetchWords,
  updateWord,
  upsertWords
} from "./vocabularyRepository";
import {
  hasMigratedLegacyEntries,
  loadLegacyEntries,
  markLegacyEntriesMigrated
} from "./legacyStorage";
import { isSupabaseConfigured, supabase } from "./supabaseClient";
import "./styles.css";

const THEME_KEY = "wordvault.theme.v1";
const ACCENT_KEY = "wordvault.accent.v1";
const CATEGORIES = ["Work", "Daily", "Email", "Interview", "Other"];
const STATUSES = ["New", "Learning", "Mastered"];
const ACCENTS = [
  { value: "en-US", label: "US" },
  { value: "en-GB", label: "UK" }
];
const LOGOS = {
  dark: "/kalemati-logo-dark.png",
  light: "/kalemati-logo-light.png"
};
const emptyForm = {
  english: "",
  arabic: "",
  meaning: "",
  example: "",
  usage: "",
  category: "Daily",
  status: "New"
};

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function loadTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || "light";
  } catch {
    return "light";
  }
}

function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

function loadAccent() {
  try {
    const storedAccent = localStorage.getItem(ACCENT_KEY);
    return ACCENTS.some((accent) => accent.value === storedAccent) ? storedAccent : "en-US";
  } catch {
    return "en-US";
  }
}

function saveAccent(accent) {
  localStorage.setItem(ACCENT_KEY, accent);
}

function StatCard({ label, value, tone }) {
  return (
    <article className={`stat-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function TextInput({ arabic, ...props }) {
  return (
    <input
      {...props}
      dir={arabic ? "rtl" : "ltr"}
      className={arabic ? "arabic-input" : undefined}
    />
  );
}

function TextArea({ arabic, ...props }) {
  return (
    <textarea
      {...props}
      dir={arabic ? "rtl" : "ltr"}
      className={arabic ? "arabic-input" : undefined}
      rows={3}
    />
  );
}

function SegmentedControl({ options, value, onChange, label }) {
  return (
    <div className="segmented" aria-label={label}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={value === option ? "active" : ""}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function ThemeToggle({ theme, onToggle }) {
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

function AccentSelector({ accent, onChange }) {
  return (
    <label className="accent-selector" title="Pronunciation accent">
      <select value={accent} onChange={(event) => onChange(event.target.value)}>
        {ACCENTS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SpeakerButton({ text, accent = "en-US", align = "start" }) {
  const [audioError, setAudioError] = useState("");

  function speak(rate) {
    const phrase = text.trim();

    if (!phrase) return;

    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setAudioError("Audio is not supported on this device.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(phrase);
    const voices = window.speechSynthesis.getVoices();
    const normalizedAccent = accent.toLowerCase();
    const englishVoice =
      voices.find((voice) => voice.lang.toLowerCase() === normalizedAccent) ||
      voices.find((voice) => voice.lang.toLowerCase().startsWith("en"));

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.lang = accent;
    utterance.rate = rate;
    utterance.pitch = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setAudioError("");
  }

  return (
    <span className={`speaker-wrap ${align}`}>
      <span className="pronunciation-speed-buttons" aria-label="Pronunciation speed buttons">
        <button type="button" aria-label={`Pronounce ${text} normally in ${accent}`} onClick={() => speak(1)}>
          🔊 Normal
        </button>
        <button type="button" aria-label={`Pronounce ${text} slowly in ${accent}`} onClick={() => speak(0.65)}>
          🐢 Slow
        </button>
      </span>
      {audioError ? <small className="audio-error">{audioError}</small> : null}
    </span>
  );
}

function App() {
  const [entries, setEntries] = useState([]);
  const [activePage, setActivePage] = useState("dashboard");
  const [editingEntry, setEditingEntry] = useState(null);
  const [theme, setTheme] = useState(loadTheme);
  const [accent, setAccent] = useState(loadAccent);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [syncNotice, setSyncNotice] = useState("");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector("link[rel='icon']")?.setAttribute("href", LOGOS[theme]);
    document.querySelector("link[rel='apple-touch-icon']")?.setAttribute("href", LOGOS[theme]);
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    saveAccent(accent);
  }, [accent]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return undefined;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      if (error) setSyncError(error.message);
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setEntries([]);
      setEditingEntry(null);
      setActivePage("dashboard");
      setSyncError("");
      setSyncNotice("");
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return undefined;

    let isMounted = true;
    const userId = session.user.id;

    async function loadAndSyncEntries() {
      setEntriesLoading(true);
      setSyncError("");
      setSyncNotice("");

      try {
        if (!hasMigratedLegacyEntries(userId)) {
          const legacyEntries = loadLegacyEntries();
          if (legacyEntries.length) {
            await upsertWords(legacyEntries, userId);
          }
          markLegacyEntriesMigrated(userId);
        }

        const { entries: cleanedWords, removed } = await cleanupDuplicateWords();
        if (isMounted) {
          setEntries(cleanedWords);
          if (removed) {
            setSyncNotice(`Removed ${removed} duplicated words.`);
          }
        }
      } catch (error) {
        if (isMounted) {
          setSyncError(error.message || "Could not sync your vocabulary.");
        }
      } finally {
        if (isMounted) setEntriesLoading(false);
      }
    }

    loadAndSyncEntries();

    const channel = supabase
      .channel(`vocabulary_words:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vocabulary_words",
          filter: `user_id=eq.${userId}`
        },
        async () => {
          try {
            const words = await fetchWords();
            if (isMounted) setEntries(words);
          } catch (error) {
            if (isMounted) {
              setSyncError(error.message || "Could not refresh synced words.");
            }
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  async function addEntry(data) {
    if (!session?.user?.id) {
      throw new Error("Please sign in before saving words.");
    }

    const existingEntry = entries.find(
      (entry) => entry.english.trim().toLowerCase() === data.english.trim().toLowerCase()
    );

    if (existingEntry) {
      await updateEntry(existingEntry.id, data);
      setActivePage("list");
      return;
    }

    const entry = {
      ...data,
      id: crypto.randomUUID(),
      dateAdded: new Date().toISOString()
    };

    const savedEntry = await createWord(entry, session.user.id);
    setEntries((current) => [savedEntry, ...current]);
    setActivePage("list");
  }

  async function updateEntry(id, patch) {
    const previousEntries = entries;
    setEntries((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry))
    );
    setSyncError("");

    try {
      const savedEntry = await updateWord(id, patch);
      setEntries((current) =>
        current.map((entry) => (entry.id === id ? savedEntry : entry))
      );
    } catch (error) {
      setEntries(previousEntries);
      setSyncError(error.message || "Could not update this word.");
      throw error;
    }
  }

  async function deleteEntry(id) {
    const previousEntries = entries;
    setEntries((current) => current.filter((entry) => entry.id !== id));
    setSyncError("");

    try {
      await deleteWord(id);
    } catch (error) {
      setEntries(previousEntries);
      setSyncError(error.message || "Could not delete this word.");
      throw error;
    }
  }

  async function saveEdit(data) {
    await updateEntry(editingEntry.id, data);
    setEditingEntry(null);
  }

  async function handleSignOut() {
    setSyncError("");
    const { error } = await supabase.auth.signOut();
    if (error) setSyncError(error.message);
  }

  const pages = {
    dashboard: (
      <Dashboard
        entries={entries}
        onNavigate={setActivePage}
      />
    ),
    add: <AddWordPage accent={accent} onSave={addEntry} />,
    list: (
      <VocabularyList
        accent={accent}
        entries={entries}
        onEdit={setEditingEntry}
      />
    ),
    review: (
      <ReviewToday
        accent={accent}
        entries={entries}
        onUpdate={updateEntry}
      />
    ),
    quiz: <QuizPage accent={accent} entries={entries} />
  };

  if (authLoading) {
    return (
      <AppFrame theme={theme} setTheme={setTheme}>
        <LoadingState text="Loading your secure workspace..." />
      </AppFrame>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <AppFrame theme={theme} setTheme={setTheme}>
        <EmptyState
          icon={<Library size={32} />}
          title="Connect Supabase"
          text="Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file, then restart the app."
        />
      </AppFrame>
    );
  }

  if (!session) {
    return (
      <AppFrame theme={theme} setTheme={setTheme}>
        <AuthPage />
      </AppFrame>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-heading">
          <div className="brand-row">
            <div>
              <p className="brand-name"><span>K</span>alemati</p>
            </div>
          </div>
          <h1>{pageTitle(activePage)}</h1>
        </div>
        <div className="topbar-actions">
          <AccentSelector accent={accent} onChange={setAccent} />
          <ThemeToggle
            theme={theme}
            onToggle={() => setTheme(theme === "light" ? "dark" : "light")}
          />
          <button
            className="icon-button"
            type="button"
            title="Sign out"
            onClick={handleSignOut}
          >
            <LogOut size={20} />
          </button>
          <button
            className="icon-button"
            type="button"
            title="Add word"
            onClick={() => setActivePage("add")}
          >
            <Plus size={22} />
          </button>
        </div>
      </header>

      <main>
        {syncError ? <p className="error-note sync-note" role="alert">{syncError}</p> : null}
        {syncNotice ? <p className="success-note sync-note" role="status">{syncNotice}</p> : null}
        {entriesLoading ? <LoadingState text="Syncing your words..." /> : pages[activePage]}
      </main>

      <Navigation activePage={activePage} onNavigate={setActivePage} />

      {editingEntry ? (
        <EditModal
          entry={editingEntry}
          onCancel={() => setEditingEntry(null)}
          onSave={saveEdit}
          onDelete={async () => {
            await deleteEntry(editingEntry.id);
            setEditingEntry(null);
          }}
        />
      ) : null}
    </div>
  );
}

function AppFrame({ children, theme, setTheme }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-heading">
          <div className="brand-row">
            <div>
              <p className="brand-name"><span>K</span>alemati</p>
            </div>
          </div>
        </div>
        <ThemeToggle
          theme={theme}
          onToggle={() => setTheme(theme === "light" ? "dark" : "light")}
        />
      </header>
      <main>{children}</main>
    </div>
  );
}

function AuthPage() {
  const [mode, setMode] = useState("Sign in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setAuthError("");
    setAuthMessage("");

    if (!email.trim() || password.length < 6) {
      setAuthError("Enter your email and a password with at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const credentials = {
        email: email.trim(),
        password
      };
      const { error } =
        mode === "Sign in"
          ? await supabase.auth.signInWithPassword(credentials)
          : await supabase.auth.signUp(credentials);

      if (error) throw error;

      if (mode === "Create account") {
        setAuthMessage("Account created. Check your email if Supabase asks for confirmation.");
      }
    } catch (error) {
      setAuthError(error.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-card">
      <div className="auth-header">
        <div className="auth-mark" aria-hidden="true">K</div>
        <div>
          <span className="auth-eyebrow">Kalemati account</span>
          <h1>{mode === "Sign in" ? "Welcome back" : "Create your account"}</h1>
          <p>{mode === "Sign in" ? "Continue to your vocabulary." : "Start saving your words."}</p>
        </div>
      </div>

      <div className="auth-tabs">
        <SegmentedControl
          label="Authentication mode"
          options={["Sign in", "Create account"]}
          value={mode}
          onChange={(nextMode) => {
            setMode(nextMode);
            setAuthError("");
            setAuthMessage("");
          }}
        />
      </div>

      <form className="word-form" onSubmit={handleSubmit}>
        <Field label="Email">
          <TextInput
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>
        <Field label="Password">
          <TextInput
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 6 characters"
            autoComplete={mode === "Sign in" ? "current-password" : "new-password"}
          />
        </Field>

        {authError ? <p className="error-note" role="alert">{authError}</p> : null}
        {authMessage ? <p className="success-note" role="status">{authMessage}</p> : null}

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? <LoaderCircle className="spin" size={18} /> : <Check size={18} />}
          {loading ? "Please wait..." : mode}
        </button>
      </form>
    </section>
  );
}

function LoadingState({ text }) {
  return (
    <section className="empty-state compact-state" aria-live="polite">
      <LoaderCircle className="spin" size={32} />
      <h2>{text}</h2>
    </section>
  );
}

function pageTitle(page) {
  return {
    dashboard: "Dashboard",
    add: "Add Word",
    list: "Vocabulary",
    review: "Review Today",
    quiz: "Quiz"
  }[page];
}

function Dashboard({ entries, onNavigate }) {
  const stats = useMemo(() => {
    const today = todayKey();
    return {
      total: entries.length,
      newWords: entries.filter((entry) => entry.status === "New").length,
      learning: entries.filter((entry) => entry.status === "Learning").length,
      mastered: entries.filter((entry) => entry.status === "Mastered").length,
      addedToday: entries.filter((entry) => todayKey(new Date(entry.dateAdded)) === today).length
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
        <button type="button" onClick={() => onNavigate("add")}>
          <Plus size={18} />
          Add
        </button>
      </article>

      <div className="action-grid">
        <button type="button" onClick={() => onNavigate("review")}>
          <BookOpen size={20} />
          Review
        </button>
        <button type="button" onClick={() => onNavigate("quiz")}>
          <Brain size={20} />
          Quiz
        </button>
      </div>
    </section>
  );
}

function AddWordPage({ accent, onSave }) {
  const [mode, setMode] = useState("AI Assist");
  const [form, setForm] = useState(emptyForm);
  const [generated, setGenerated] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState("");

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleAiGenerate() {
    const word = form.english.trim();

    if (!word) {
      setAiError("Type an English word or phrase first.");
      setGenerated(false);
      return;
    }

    setAiLoading(true);
    setAiError("");

    try {
      const response = await fetch("/api/generate-word", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ word })
      });

      const data = await response.json().catch(() => ({
        error: "AI endpoint is not returning JSON. Check the deployment API route."
      }));

      if (!response.ok) {
        throw new Error(data.error || "AI generation failed. Please try again.");
      }

      setForm((current) => ({
        ...current,
        english: word,
        arabic: data.arabicTranslation || "",
        meaning: data.simpleMeaning || "",
        example: data.exampleSentence || "",
        usage: data.whenToUse || "",
        category: CATEGORIES.includes(data.category) ? data.category : "Other"
      }));
      setGenerated(true);
    } catch (error) {
      setAiError(error.message || "AI generation failed. Please try again.");
      setGenerated(false);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.english.trim() || !form.arabic.trim()) return;
    setSaveLoading(true);
    setSaveError("");

    try {
      await onSave({
        ...form,
        english: form.english.trim(),
        arabic: form.arabic.trim(),
        meaning: form.meaning.trim(),
        example: form.example.trim(),
        usage: form.usage.trim()
      });
      setForm(emptyForm);
      setGenerated(false);
      setAiError("");
    } catch (error) {
      setSaveError(error.message || "Could not save this word.");
    } finally {
      setSaveLoading(false);
    }
  }

  return (
    <section className="page-stack">
      <SegmentedControl
        label="Add mode"
        options={["Quick Add", "AI Assist"]}
        value={mode}
        onChange={setMode}
      />

      <form className="word-form" onSubmit={handleSubmit}>
        <Field label="English word or phrase">
          <TextInput
            value={form.english}
            onChange={(event) => updateField("english", event.target.value)}
            placeholder="e.g. follow up"
          />
        </Field>

        {mode === "AI Assist" ? (
          <button
            className="secondary-button"
            type="button"
            onClick={handleAiGenerate}
            disabled={aiLoading}
          >
            {aiLoading ? <LoaderCircle className="spin" size={18} /> : <Sparkles size={18} />}
            {aiLoading ? "Generating..." : "Generate with AI"}
          </button>
        ) : null}

        {mode === "AI Assist" && generated ? (
          <div className="generated-audio">
            <p className="inline-note">Generated details are ready to edit before saving.</p>
            <SpeakerButton text={form.english} accent={accent} />
          </div>
        ) : null}

        {mode === "AI Assist" && aiError ? (
          <p className="error-note" role="alert">{aiError}</p>
        ) : null}

        <Field label="Arabic translation">
          <TextInput
            arabic
            value={form.arabic}
            onChange={(event) => updateField("arabic", event.target.value)}
            placeholder="اكتب الترجمة"
          />
        </Field>

        <Field label="Simple English meaning">
          <TextArea
            value={form.meaning}
            onChange={(event) => updateField("meaning", event.target.value)}
            placeholder="Short, simple meaning"
          />
        </Field>

        <Field label="Example sentence">
          <TextArea
            value={form.example}
            onChange={(event) => updateField("example", event.target.value)}
            placeholder="Use it in a sentence"
          />
        </Field>

        <Field label="Notes / when to use it">
          <TextArea
            value={form.usage}
            onChange={(event) => updateField("usage", event.target.value)}
            placeholder="Work, daily conversation, email..."
          />
        </Field>

        <div className="two-column">
          <Field label="Category">
            <select
              value={form.category}
              onChange={(event) => updateField("category", event.target.value)}
            >
              {CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(event) => updateField("status", event.target.value)}
            >
              {STATUSES.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </Field>
        </div>

        {saveError ? <p className="error-note" role="alert">{saveError}</p> : null}

        <button className="primary-button" type="submit" disabled={saveLoading}>
          {saveLoading ? <LoaderCircle className="spin" size={18} /> : <Save size={18} />}
          {saveLoading ? "Saving..." : "Save Word"}
        </button>
      </form>
    </section>
  );
}

function VocabularyList({ accent, entries, onEdit }) {
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

function WordCard({ accent, entry, onEdit }) {
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

      {entry.example ? <p className="example">"{entry.example}"</p> : null}
      {entry.meaning ? <p>{entry.meaning}</p> : null}
      {entry.usage ? <p className="muted">{entry.usage}</p> : null}

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

function ConfirmDeleteModal({ entry, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Confirm delete">
      <div className="modal-card confirm-card">
        <div className="modal-header">
          <h2>Delete word?</h2>
          <button className="modal-close-button" type="button" onClick={onCancel} title="Close">
            <X size={20} />
          </button>
        </div>
        <p>
          Are you sure you want to delete <strong>{entry.english}</strong>?
        </p>
        <p dir="rtl" lang="ar" className="confirm-arabic">
          {entry.arabic}
        </p>
        <div className="confirm-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="danger-button" type="button" onClick={onConfirm}>
            <Trash2 size={17} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewToday({ accent, entries, onUpdate }) {
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

function QuizPage({ accent, entries }) {
  const entryIdsKey = useMemo(() => entries.map((entry) => entry.id).sort().join("|"), [entries]);
  const [quizIds, setQuizIds] = useState([]);
  const [quizState, setQuizState] = useState({
    index: 0,
    answer: "",
    submittedQuestionId: null,
    score: { correct: 0, total: 0 }
  });
  const entriesById = useMemo(
    () => new Map(entries.map((entry) => [entry.id, entry])),
    [entries]
  );
  const quizItems = useMemo(
    () => quizIds.map((id) => entriesById.get(id)).filter(Boolean),
    [entriesById, quizIds]
  );
  const current = quizItems[quizState.index];
  const isSubmitted = Boolean(current && quizState.submittedQuestionId === current.id);

  useEffect(() => {
    setQuizIds(shuffle(entries).map((entry) => entry.id));
    setQuizState({
      index: 0,
      answer: "",
      submittedQuestionId: null,
      score: { correct: 0, total: 0 }
    });
  }, [entryIdsKey]);

  function submitAnswer(event) {
    event.preventDefault();
    if (!current || isSubmitted) return;
    const isCorrect = normalizeArabic(quizState.answer) === normalizeArabic(current.arabic);
    setQuizState((value) => ({
      ...value,
      submittedQuestionId: current.id,
      score: {
        correct: value.score.correct + (isCorrect ? 1 : 0),
        total: value.score.total + 1
      }
    }));
  }

  function nextQuestion() {
    setQuizState((value) => ({
      ...value,
      index: value.index + 1 >= quizItems.length ? 0 : value.index + 1,
      answer: "",
      submittedQuestionId: null
    }));
  }

  if (!entries.length) {
    return (
      <EmptyState
        icon={<Brain size={32} />}
        title="Quiz is empty"
        text="Add words to start a quiz."
      />
    );
  }

  if (!quizIds.length || !current) {
    return <LoadingState text="Preparing your quiz..." />;
  }

  return (
    <section className="page-stack quiz-page">
      <div className="score-bar">
        <span>Score</span>
        <strong>
          {quizState.score.correct}/{quizState.score.total}
        </strong>
      </div>

      <article className="quiz-card">
        <span>Translate to Arabic</span>
        <div className="center-title-row">
          <h2>{current.english}</h2>
          <SpeakerButton
            text={current.english}
            accent={accent}
            align="center"
          />
        </div>
      </article>

      <form className="word-form" onSubmit={submitAnswer} key={current.id}>
        <Field label="Arabic translation">
          <TextInput
            arabic
            value={quizState.answer}
            onChange={(event) =>
              setQuizState((value) => ({ ...value, answer: event.target.value }))
            }
            placeholder="اكتب المعنى"
          />
        </Field>

        {isSubmitted ? (
          <div className="answer-panel">
            <span>Correct answer</span>
            <strong dir="rtl" lang="ar">{current.arabic}</strong>
          </div>
        ) : null}

        {!isSubmitted ? (
          <button className="primary-button" type="submit">
            <Check size={18} />
            Submit
          </button>
        ) : (
          <button className="primary-button" type="button" onClick={nextQuestion}>
            Next
          </button>
        )}
      </form>
    </section>
  );
}

function EditModal({ entry, onSave, onCancel, onDelete }) {
  const [form, setForm] = useState({
    english: entry.english,
    arabic: entry.arabic,
    meaning: entry.meaning,
    example: entry.example,
    usage: entry.usage,
    category: entry.category,
    status: entry.status
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaveLoading(true);
    setSaveError("");

    try {
      await onSave(form);
    } catch (error) {
      setSaveError(error.message || "Could not save your changes.");
    } finally {
      setSaveLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Edit word">
      <div className="modal-card">
        <div className="modal-header">
          <h2>Edit word</h2>
          <button className="modal-close-button" type="button" onClick={onCancel} title="Close">
            <X size={20} />
          </button>
        </div>

        <form className="word-form compact" onSubmit={handleSubmit}>
          <Field label="English word or phrase">
            <TextInput value={form.english} onChange={(event) => updateField("english", event.target.value)} />
          </Field>
          <Field label="Arabic translation">
            <TextInput arabic value={form.arabic} onChange={(event) => updateField("arabic", event.target.value)} />
          </Field>
          <Field label="Simple English meaning">
            <TextArea value={form.meaning} onChange={(event) => updateField("meaning", event.target.value)} />
          </Field>
          <Field label="Example sentence">
            <TextArea value={form.example} onChange={(event) => updateField("example", event.target.value)} />
          </Field>
          <Field label="When to use it">
            <TextArea value={form.usage} onChange={(event) => updateField("usage", event.target.value)} />
          </Field>
          <div className="two-column">
            <Field label="Category">
              <select value={form.category} onChange={(event) => updateField("category", event.target.value)}>
                {CATEGORIES.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                {STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </Field>
          </div>
          {saveError ? <p className="error-note" role="alert">{saveError}</p> : null}

          <div className="modal-action-row">
            <button className="primary-button" type="submit" disabled={saveLoading}>
              {saveLoading ? <LoaderCircle className="spin" size={18} /> : <Save size={18} />}
              {saveLoading ? "Saving..." : "Save Changes"}
            </button>
            <button
              className="danger-button"
              type="button"
              onClick={() => setDeleteTarget(entry)}
            >
              <Trash2 size={17} />
              Delete
            </button>
          </div>
        </form>
      </div>

      {deleteTarget ? (
        <ConfirmDeleteModal
          entry={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            try {
              await onDelete();
            } catch (error) {
              setSaveError(error.message || "Could not delete this word.");
            }
          }}
        />
      ) : null}
    </div>
  );
}

function Navigation({ activePage, onNavigate }) {
  const items = [
    { id: "dashboard", label: "Home", icon: Home },
    { id: "add", label: "Add", icon: Plus },
    { id: "list", label: "Words", icon: Library },
    { id: "review", label: "Review", icon: BookOpen },
    { id: "quiz", label: "Quiz", icon: Brain }
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

function EmptyState({ icon, title, text }) {
  return (
    <section className="empty-state">
      {icon}
      <h2>{title}</h2>
      <p>{text}</p>
    </section>
  );
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function normalizeArabic(value) {
  return value.trim().replace(/\s+/g, "").toLowerCase();
}

createRoot(document.getElementById("root")).render(<App />);

