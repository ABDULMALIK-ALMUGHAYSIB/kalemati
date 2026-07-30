import { ACCENTS } from "../constants";

export function AccentSelector({ accent, onChange }) {
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
