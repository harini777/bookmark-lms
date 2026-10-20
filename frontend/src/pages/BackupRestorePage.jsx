import React, { useState } from 'react'
import { adminApi } from '../api/endpoints'
import Sidebar from '../components/Sidebar'
import Spinner from '../components/Spinner'
import Alert from '../components/Alert'

export default function BackupRestorePage() {
  const [backupData, setBackupData] = useState(null)
  const [restoreInput, setRestoreInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleExport = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await adminApi.getBackup()
      setBackupData(res.data)
      setSuccess('Database backup generated successfully!')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to export backup')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!backupData) return
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookmark_lms_backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleRestore = async (e) => {
    e.preventDefault()
    if (!restoreInput.trim()) {
      setError('Please paste the backup JSON data to restore.')
      return
    }
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const parsed = JSON.parse(restoreInput)
      const res = await adminApi.restore(parsed)
      setSuccess(res.data?.message ?? 'Database verified & restored successfully!')
      setRestoreInput('')
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Restore failed: Invalid JSON or corrupted file.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">💾 Database Backup & Restore (UC21)</h1>
            <p className="page-subtitle">Export system snapshots or restore database state (F42)</p>
          </div>
        </header>

        <div className="page-body">
          {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-6)' }}>
            {/* Backup Card */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">📦 Create Snapshot Backup</h2>
              </div>
              <div style={{ padding: 'var(--sp-6)' }}>
                <p style={{ color: 'var(--clr-text-2)', fontSize: 'var(--text-sm)', lineHeight: 1.5, marginBottom: 'var(--sp-4)' }}>
                  Generates an encrypted JSON backup snapshot containing all books, members, active loans, and reservation queue data.
                </p>
                <div style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
                  <button className="btn btn-primary" onClick={handleExport} disabled={loading}>
                    {loading ? '⏳ Generating Snapshot…' : '🔄 Generate Backup'}
                  </button>
                  {backupData && (
                    <button className="btn btn-outline" onClick={handleDownload}>
                      📥 Download JSON File
                    </button>
                  )}
                </div>

                {backupData && (
                  <div style={{ background: 'var(--clr-surface-2)', padding: 'var(--sp-4)', borderRadius: 'var(--radius)', border: '1px solid var(--clr-border)', maxHeight: 250, overflowY: 'auto' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-2)', marginBottom: 6 }}>
                      Exported At: <strong>{backupData.exportedAt}</strong>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-2)' }}>
                      Catalog Titles: <strong>{backupData.totalBooks}</strong> • Registered Accounts: <strong>{backupData.totalUsers}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Restore Card */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">♻️ Restore Database</h2>
              </div>
              <div style={{ padding: 'var(--sp-6)' }}>
                <p style={{ color: 'var(--clr-text-2)', fontSize: 'var(--text-sm)', lineHeight: 1.5, marginBottom: 'var(--sp-4)' }}>
                  Restore previously exported library data. The system verifies checksum integrity and schema structure before applying.
                </p>
                <form onSubmit={handleRestore}>
                  <div className="form-group">
                    <label className="form-label">Backup JSON Payload</label>
                    <textarea
                      rows={6}
                      className="form-control"
                      placeholder='Paste JSON here (e.g. {"version": "1.0", "exportedAt": "...", ...})'
                      value={restoreInput}
                      onChange={e => setRestoreInput(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn btn-danger" disabled={loading}>
                    {loading ? '⏳ Restoring…' : '⚠️ Verify & Restore'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
