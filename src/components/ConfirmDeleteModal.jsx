import { Trash2, X } from "lucide-react";

export function ConfirmDeleteModal({ entry, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Confirm delete">
      <div className="modal-card confirm-card">
        <div className="modal-header">
          <h2>Delete word?</h2>
          <button className="modal-close-button" type="button" onClick={onCancel} title="Close">
            <X size={20} />
          </button>
        </div>
        <p>
          Are you sure you want to delete <strong>{entry.english}</strong>?
        </p>
        <p dir="rtl" lang="ar" className="confirm-arabic">
          {entry.arabic}
        </p>
        <div className="confirm-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="danger-button" type="button" onClick={onConfirm}>
            <Trash2 size={17} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
