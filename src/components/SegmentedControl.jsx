export function SegmentedControl({ options, value, onChange, label }) {
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
