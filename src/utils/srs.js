export function isDue(entry, now = new Date()) {
  if (!entry.nextReviewAt) return true;
  return new Date(entry.nextReviewAt) <= now;
}
