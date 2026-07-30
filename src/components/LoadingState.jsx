import { LoaderCircle } from "lucide-react";

export function LoadingState({ text }) {
  return (
    <section className="empty-state compact-state" aria-live="polite">
      <LoaderCircle className="spin" size={32} />
      <h2>{text}</h2>
    </section>
  );
}
