import React from 'react'

export default function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = 'Confirm', confirmClass = 'btn-danger' }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">⚠️ {title}</h2>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--clr-text-2)', fontSize: 'var(--text-sm)' }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" id="btn-cancel-confirm" onClick={onCancel}>Cancel</button>
          <button className={`btn ${confirmClass}`} id="btn-confirm-action" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
