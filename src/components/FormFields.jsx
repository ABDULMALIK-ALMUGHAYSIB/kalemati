export function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

export function TextInput({ arabic, ...props }) {
  return (
    <input
      {...props}
      dir={arabic ? "rtl" : "ltr"}
      className={arabic ? "arabic-input" : undefined}
    />
  );
}

export function TextArea({ arabic, ...props }) {
  return (
    <textarea
      {...props}
      dir={arabic ? "rtl" : "ltr"}
      className={arabic ? "arabic-input" : undefined}
      rows={3}
    />
  );
}
