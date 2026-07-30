import { BrandRefreshButton } from "./BrandRefreshButton";
import { ThemeToggle } from "./ThemeToggle";

export function AppFrame({ children, theme, setTheme }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-heading">
          <div className="brand-row">
            <div>
              <BrandRefreshButton />
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
