import { useState } from "react";
import { LoaderCircle, Save, Trash2, X } from "lucide-react";
import { CATEGORIES, STATUSES } from "../constants";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { Field, TextArea, TextInput } from "./FormFields";

export function EditModal({ entry, onSave, onCancel, onDelete }) {
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
