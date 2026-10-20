import React, { useEffect, useState, useCallback } from 'react'
import { memberApi } from '../api/endpoints'
import Sidebar from '../components/Sidebar'
import Spinner from '../components/Spinner'
import Alert from '../components/Alert'

export default function MembersPage() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    try {
      const res = search
        ? await memberApi.search(search)
        : await memberApi.getAll()
      setMembers(res.data)
    } catch {
      setError('Failed to load members')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  const handleStatusChange = async (id, status) => {
    try {
      await memberApi.updateStatus(id, status)
      setSuccess(`Member status updated to ${status}`)
      fetchMembers()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Status update failed')
    }
  }

  const statusBadge = status => {
    const map = { APPROVED: 'badge-success', PENDING: 'badge-warning', REJECTED: 'badge-danger' }
    return <span className={`badge ${map[status] ?? 'badge-gray'}`}>{status}</span>
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">👥 Member Management</h1>
            <p className="page-subtitle">{members.length} member{members.length !== 1 ? 's' : ''}</p>
          </div>
        </header>

        <div className="page-body">
          {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

          <form
            onSubmit={e => { e.preventDefault(); setSearch(searchInput) }}
            className="mb-6"
            style={{ display: 'flex', gap: 'var(--sp-3)', maxWidth: 500 }}
          >
            <div className="search-bar flex-1">
              <span className="search-icon">🔍</span>
              <input
                id="member-search-input"
                placeholder="Search by name, username or email…"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
            </div>
            <button id="btn-member-search" type="submit" className="btn btn-primary">Search</button>
            {search && (
              <button type="button" className="btn btn-outline" onClick={() => { setSearch(''); setSearchInput('') }}>Clear</button>
            )}
          </form>

          {loading ? <Spinner /> : members.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">👤</div>
                <div className="empty-state-title">No members found</div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Name</th><th>Username</th><th>Email</th><th>Phone</th><th>Status</th><th>Registered</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {members.map(m => (
                      <tr key={m.id}>
                        <td><strong>{m.fullName}</strong></td>
                        <td><span style={{ fontFamily: 'monospace' }}>@{m.username}</span></td>
                        <td>{m.email}</td>
                        <td>{m.phone || '—'}</td>
                        <td>{statusBadge(m.status)}</td>
                        <td>{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                            {m.status !== 'APPROVED' && (
                              <button
                                id={`btn-approve-member-${m.id}`}
                                className="btn btn-success btn-sm"
                                onClick={() => handleStatusChange(m.id, 'APPROVED')}
                              >✅ Approve</button>
                            )}
                            {m.status !== 'REJECTED' && (
                              <button
                                id={`btn-reject-member-${m.id}`}
                                className="btn btn-danger btn-sm"
                                onClick={() => handleStatusChange(m.id, 'REJECTED')}
                              >❌ Reject</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
