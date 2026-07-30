export function EmptyState({ icon, title, text }) {
  return (
    <section className="empty-state">
      {icon}
      <h2>{title}</h2>
      <p>{text}</p>
    </section>
  );
}
