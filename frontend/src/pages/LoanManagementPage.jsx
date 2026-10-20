import React, { useEffect, useState, useCallback } from 'react'
import { loanApi, memberApi, bookApi, reservationApi } from '../api/endpoints'
import Sidebar from '../components/Sidebar'
import Spinner from '../components/Spinner'
import Alert from '../components/Alert'
import ConfirmDialog from '../components/ConfirmDialog'

function formatDate(d) { return d ? new Date(d).toLocaleDateString() : '—' }
const isOverdue = dueDate => new Date(dueDate) < new Date()

function IssueModal({ onClose, onSave }) {
  const [members, setMembers] = useState([])
  const [books, setBooks] = useState([])
  const [form, setForm] = useState({ memberId: '', bookId: '' })
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    Promise.all([memberApi.getAll(), bookApi.getAll()]).then(([m, b]) => {
      setMembers(m.data.filter(u => u.status === 'APPROVED' || u.status === 'ACTIVE'))
      setBooks(b.data.filter(b => b.availableCopies > 0))
    })
  }, [])

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.memberId || !form.bookId) { setApiError('Member and book are required'); return }
    setLoading(true)
    setApiError('')
    try {
      await loanApi.issue({ memberId: parseInt(form.memberId), bookId: parseInt(form.bookId) })
      onSave()
    } catch (err) {
      setApiError(err.response?.data?.message ?? 'Issue failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">📤 Issue Book (UC7 / F21)</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {apiError && <Alert type="error">{apiError}</Alert>}
          <form id="issue-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Approved Member <span className="required">*</span></label>
              <select id="issue-member-select" className="form-control"
                value={form.memberId} onChange={e => setForm({ ...form, memberId: e.target.value })}>
                <option value="">Select an approved member…</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.fullName} (@{m.username})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Available Book <span className="required">*</span></label>
              <select id="issue-book-select" className="form-control"
                value={form.bookId} onChange={e => setForm({ ...form, bookId: e.target.value })}>
                <option value="">Select an available book…</option>
                {books.map(b => (
                  <option key={b.id} value={b.id}>{b.title} — {b.availableCopies} copy(ies) available</option>
                ))}
              </select>
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" id="btn-issue-cancel" onClick={onClose}>Cancel</button>
          <button className="btn btn-success" id="btn-issue-confirm" form="issue-form" type="submit" disabled={loading}>
            {loading ? '⏳ Issuing…' : '📤 Issue Book (14 Days)'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ReportLostModal({ loan, onClose, onSave }) {
  const [status, setStatus] = useState('LOST')
  const [penalty, setPenalty] = useState('200')
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setApiError('')
    try {
      await loanApi.report(loan.id, status, penalty)
      onSave()
    } catch (err) {
      setApiError(err.response?.data?.message ?? 'Action failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">⚠️ Report Lost or Damaged Book (F27)</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {apiError && <Alert type="error">{apiError}</Alert>}
          <form id="report-form" onSubmit={handleSubmit}>
            <p><strong>Book:</strong> {loan.bookTitle}</p>
            <p><strong>Member:</strong> {loan.memberName}</p>
            <div className="form-group">
              <label className="form-label">Incident Type</label>
              <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="LOST">Book Lost</option>
                <option value="DAMAGED">Book Damaged</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Replacement Fee / Penalty (₹)</label>
              <input type="number" className="form-control" value={penalty} onChange={e => setPenalty(e.target.value)} />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" form="report-form" type="submit" disabled={loading}>
            {loading ? 'Processing…' : 'Record Incident'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LoanManagementPage() {
  const [activeLoans, setActiveLoans] = useState([])
  const [overdueLoans, setOverdueLoans] = useState([])
  const [activeReservations, setActiveReservations] = useState([])
  const [currentTab, setCurrentTab] = useState('active') // 'active' | 'overdue' | 'reservations'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [returnTarget, setReturnTarget] = useState(null)
  const [lostTarget, setLostTarget] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [act, ovd, res] = await Promise.all([
        loanApi.getActive(),
        loanApi.getOverdue(),
        reservationApi.getActive(),
      ])
      setActiveLoans(act.data)
      setOverdueLoans(ovd.data)
      setActiveReservations(res.data)
    } catch {
      setError('Failed to load circulation records')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleReturn = async () => {
    try {
      await loanApi.return(returnTarget.id)
      setReturnTarget(null)
      setSuccess('Book return processed successfully! Inventory updated.')
      fetchData()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Return failed')
      setReturnTarget(null)
    }
  }

  const handleRenew = async (loanId) => {
    setActionLoading(true)
    try {
      await loanApi.renew(loanId)
      setSuccess('Book renewed successfully! Due date extended.')
      fetchData()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Renewal failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePayFine = async (loanId) => {
    setActionLoading(true)
    try {
      await loanApi.payFine(loanId)
      setSuccess('Fine payment collected and recorded!')
      fetchData()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Payment recording failed')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">📋 Circulation & Loan Management</h1>
            <p className="page-subtitle">Manage checkouts, returns, renewals, fines, and reservations (F21–F33)</p>
          </div>
          <button id="btn-issue-book" className="btn btn-primary" onClick={() => setShowIssueModal(true)}>
            📤 Issue Book (UC7)
          </button>
        </header>

        <div className="page-body">
          {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-6)', borderBottom: '1px solid var(--clr-border)', paddingBottom: 'var(--sp-2)' }}>
            <button
              className={`btn btn-sm ${currentTab === 'active' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setCurrentTab('active')}
            >
              📖 Active Loans ({activeLoans.length})
            </button>
            <button
              className={`btn btn-sm ${currentTab === 'overdue' ? 'btn-danger' : 'btn-ghost'}`}
              onClick={() => setCurrentTab('overdue')}
            >
              ⚠️ Overdue Loans ({overdueLoans.length})
            </button>
            <button
              className={`btn btn-sm ${currentTab === 'reservations' ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={() => setCurrentTab('reservations')}
            >
              📌 Reservation Queue ({activeReservations.length})
            </button>
          </div>

          {loading ? <Spinner /> : (
            <>
              {currentTab === 'active' && (
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Active Borrowings</h2>
                  </div>
                  {activeLoans.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">📭</div>
                      <div className="empty-state-title">No active loans</div>
                      <div className="empty-state-text">Use the "Issue Book" button above to check out a title.</div>
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Loan ID</th>
                            <th>Member</th>
                            <th>Book</th>
                            <th>Issue Date</th>
                            <th>Due Date</th>
                            <th>Renewals</th>
                            <th>Fine</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeLoans.map(loan => (
                            <tr key={loan.id}>
                              <td>#{loan.id}</td>
                              <td>
                                <strong>{loan.memberName}</strong><br />
                                <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-2)' }}>@{loan.memberUsername}</span>
                              </td>
                              <td>
                                <strong>{loan.bookTitle}</strong><br />
                                <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-2)', fontFamily: 'monospace' }}>{loan.bookIsbn}</span>
                              </td>
                              <td>{formatDate(loan.issueDate)}</td>
                              <td style={{ color: isOverdue(loan.dueDate) ? 'var(--clr-danger)' : 'inherit', fontWeight: isOverdue(loan.dueDate) ? 600 : 400 }}>
                                {formatDate(loan.dueDate)}
                                {isOverdue(loan.dueDate) && <span className="badge badge-danger" style={{ marginLeft: 6 }}>Overdue</span>}
                              </td>
                              <td>{loan.renewalCount ?? 0} / 2</td>
                              <td>
                                {parseFloat(loan.fine) > 0 ? (
                                  <div>
                                    <span style={{ color: 'var(--clr-danger)', fontWeight: 600 }}>₹{loan.fine}</span>
                                    {loan.finePaid ? (
                                      <span className="badge badge-success" style={{ marginLeft: 4 }}>Paid</span>
                                    ) : (
                                      <button className="btn btn-ghost btn-sm" onClick={() => handlePayFine(loan.id)} style={{ padding: '2px 6px', fontSize: '0.75rem' }}>
                                        Collect
                                      </button>
                                    )}
                                  </div>
                                ) : '₹0'}
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                                  <button
                                    id={`btn-return-loan-${loan.id}`}
                                    className="btn btn-success btn-sm"
                                    onClick={() => setReturnTarget(loan)}
                                  >
                                    📥 Return
                                  </button>
                                  <button
                                    id={`btn-staff-renew-${loan.id}`}
                                    className="btn btn-outline btn-sm"
                                    onClick={() => handleRenew(loan.id)}
                                    disabled={actionLoading || (loan.renewalCount ?? 0) >= 2}
                                  >
                                    🔄 Renew
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => setLostTarget(loan)}
                                    title="Report lost or damaged"
                                  >
                                    ⚠️ Lost
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {currentTab === 'overdue' && (
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">⚠️ Overdue Borrowings (Fine: ₹10/day)</h2>
                  </div>
                  {overdueLoans.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">✅</div>
                      <div className="empty-state-title">No overdue loans!</div>
                      <div className="empty-state-text">All active checkouts are within their borrow period.</div>
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Loan ID</th>
                            <th>Member</th>
                            <th>Book Title</th>
                            <th>Due Date</th>
                            <th>Accrued Fine (₹10/day)</th>
                            <th>Payment Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {overdueLoans.map(loan => (
                            <tr key={loan.id}>
                              <td>#{loan.id}</td>
                              <td><strong>{loan.memberName}</strong></td>
                              <td>{loan.bookTitle}</td>
                              <td style={{ color: 'var(--clr-danger)', fontWeight: 600 }}>{formatDate(loan.dueDate)}</td>
                              <td style={{ color: 'var(--clr-danger)', fontWeight: 700 }}>₹{loan.fine}</td>
                              <td>
                                {loan.finePaid ? (
                                  <span className="badge badge-success">Cleared</span>
                                ) : (
                                  <span className="badge badge-danger">Unpaid</span>
                                )}
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                                  <button className="btn btn-success btn-sm" onClick={() => setReturnTarget(loan)}>
                                    📥 Return Book
                                  </button>
                                  {!loan.finePaid && (
                                    <button className="btn btn-primary btn-sm" onClick={() => handlePayFine(loan.id)}>
                                      💰 Collect ₹{loan.fine}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {currentTab === 'reservations' && (
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">📌 Live Reservation Queue (F30)</h2>
                  </div>
                  {activeReservations.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">📌</div>
                      <div className="empty-state-title">No reservations in queue</div>
                      <div className="empty-state-text">Books are currently directly available or have no waiting members.</div>
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Book Title</th>
                            <th>ISBN</th>
                            <th>Reserved By</th>
                            <th>Date Requested</th>
                            <th>Queue Position</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeReservations.map(res => (
                            <tr key={res.id}>
                              <td><strong>{res.bookTitle}</strong></td>
                              <td style={{ fontFamily: 'monospace' }}>{res.bookIsbn}</td>
                              <td>{res.memberName} (@{res.memberUsername})</td>
                              <td>{formatDate(res.reservationDate)}</td>
                              <td><span className="badge badge-purple">Position #{res.queuePosition}</span></td>
                              <td><span className="badge badge-teal">{res.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showIssueModal && (
        <IssueModal
          onClose={() => setShowIssueModal(false)}
          onSave={() => { setShowIssueModal(false); setSuccess('Book issued successfully!'); fetchData(); setTimeout(() => setSuccess(''), 3000) }}
        />
      )}

      {returnTarget && (
        <ConfirmDialog
          title="Return Book (UC8)"
          message={`Return "${returnTarget.bookTitle}" borrowed by ${returnTarget.memberName}? If returned overdue, fine of ₹10/day will be calculated.`}
          onConfirm={handleReturn}
          onCancel={() => setReturnTarget(null)}
          confirmLabel="Confirm Return"
          confirmClass="btn-success"
        />
      )}

      {lostTarget && (
        <ReportLostModal
          loan={lostTarget}
          onClose={() => setLostTarget(null)}
          onSave={() => { setLostTarget(null); setSuccess('Incident recorded & inventory adjusted.'); fetchData(); setTimeout(() => setSuccess(''), 3000) }}
        />
      )}
    </div>
  )
}
