import { useEffect, useState } from "react";
import { Library, LogOut, Plus } from "lucide-react";
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
import { LOGOS } from "./constants";
import { loadAccent, loadTheme, pageTitle, saveAccent, saveTheme } from "./utils/helpers";
import { AccentSelector } from "./components/AccentSelector";
import { AppFrame } from "./components/AppFrame";
import { BrandRefreshButton } from "./components/BrandRefreshButton";
import { EditModal } from "./components/EditModal";
import { EmptyState } from "./components/EmptyState";
import { LoadingState } from "./components/LoadingState";
import { Navigation } from "./components/Navigation";
import { ThemeToggle } from "./components/ThemeToggle";
import { AddWordPage } from "./pages/AddWordPage";
import { AuthPage } from "./pages/AuthPage";
import { Dashboard } from "./pages/Dashboard";
import { LessonsPage } from "./pages/LessonsPage";
import { StoriesPage } from "./pages/StoriesPage";
import { VocabularyList } from "./pages/VocabularyList";

export function App() {
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

    const { data: authListener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);

      if (event === "SIGNED_OUT") {
        setEntries([]);
        setEditingEntry(null);
        setActivePage("dashboard");
        setSyncError("");
        setSyncNotice("");
      }
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
    review: <StoriesPage accent={accent} entries={entries} />,
    lessons: <LessonsPage />
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
              <BrandRefreshButton />
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
