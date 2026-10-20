import React from 'react'

export default function Alert({ type = 'info', children, onClose }) {
  const icon = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }[type]

  return (
    <div className={`alert alert-${type}`} role="alert">
      <span>{icon}</span>
      <span style={{ flex: 1 }}>{children}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
          aria-label="Close"
        >
          ×
        </button>
      )}
    </div>
  )
}
