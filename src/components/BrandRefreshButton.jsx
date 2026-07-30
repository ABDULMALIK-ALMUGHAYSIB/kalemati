export function BrandRefreshButton() {
  return (
    <button
      className="brand-name brand-refresh-button"
      type="button"
      title="Refresh page"
      aria-label="Refresh Kalemati"
      onClick={() => window.location.reload()}
    >
      <span>K</span>alemati
    </button>
  );
}
