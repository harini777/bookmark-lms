import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { loanApi, bookApi, reservationApi, memberApi } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Spinner from '../components/Spinner'
import Alert from '../components/Alert'

function formatDate(d) { return d ? new Date(d).toLocaleDateString() : '—' }
function isOverdue(dueDate) { return !dueDate ? false : new Date(dueDate) < new Date() }

export default function MemberDashboard() {
  const { user } = useAuth()
  const [activeLoans, setActiveLoans] = useState([])
  const [history, setHistory] = useState([])
  const [reservations, setReservations] = useState([])
  const [recentBooks, setRecentBooks] = useState([])
  const [memberProfile, setMemberProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const loadDashboard = useCallback(async () => {
    try {
      const [active, all, resList, books, me] = await Promise.all([
        loanApi.getMemberActiveLoans(user.userId),
        loanApi.getMemberLoans(user.userId),
        reservationApi.getMemberReservations(user.userId),
        bookApi.getAll(),
        memberApi.getMe(),
      ])
      setActiveLoans(active.data)
      setHistory(all.data.filter(l => l.returned))
      setReservations(resList.data)
      setRecentBooks(books.data.slice(0, 6))
      setMemberProfile(me.data)
    } catch {
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [user.userId])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const handleRenew = async (loanId) => {
    setActionLoading(true)
    setError('')
    setSuccess('')
    try {
      await loanApi.renew(loanId)
      setSuccess('Book loan renewed successfully! Due date extended by 14 days.')
      loadDashboard()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to renew loan')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePayFine = async (loanId) => {
    setActionLoading(true)
    setError('')
    setSuccess('')
    try {
      await loanApi.payFine(loanId)
      setSuccess('Fine payment recorded successfully! Balance cleared.')
      loadDashboard()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process fine payment')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelReservation = async (resId) => {
    setActionLoading(true)
    setError('')
    setSuccess('')
    try {
      await reservationApi.cancel(resId)
      setSuccess('Reservation cancelled successfully.')
      loadDashboard()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel reservation')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReserve = async (bookId) => {
    setActionLoading(true)
    setError('')
    setSuccess('')
    try {
      await reservationApi.reserve(bookId)
      setSuccess('Book reserved successfully! You have been added to the queue.')
      loadDashboard()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reserve book')
    } finally {
      setActionLoading(false)
    }
  }

  const totalOutstandingFines = activeLoans
    .concat(history.filter(h => !h.finePaid))
    .reduce((s, l) => s + (parseFloat(l.fine) || 0), 0)
    .toFixed(2)

  const activeReservations = reservations.filter(r => r.status === 'ACTIVE')

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">Welcome, {user.fullName ?? user.username}! 👋</h1>
            <p className="page-subtitle">Member ID: #{user.userId} • Status: <span className="badge badge-success">{memberProfile?.status ?? 'APPROVED'}</span></p>
          </div>
          <Link to="/catalogue" className="btn btn-primary" id="btn-browse-books">Browse Catalog</Link>
        </header>

        <div className="page-body">
          {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

          {loading ? <Spinner /> : (
            <>
              <div className="stats-grid mb-8">
                <div className="stat-card">
                  <div className="stat-icon purple">📖</div>
                  <div>
                    <div className="stat-value">{activeLoans.length} / 5</div>
                    <div className="stat-label">Active Loans (Max 5)</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon green">✅</div>
                  <div>
                    <div className="stat-value">{history.length}</div>
                    <div className="stat-label">Books Returned</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon orange">📌</div>
                  <div>
                    <div className="stat-value">{activeReservations.length}</div>
                    <div className="stat-label">Active Reservations</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon red">💰</div>
                  <div>
                    <div className="stat-value">₹{totalOutstandingFines}</div>
                    <div className="stat-label">Outstanding Fines</div>
                  </div>
                </div>
              </div>

              {/* Active Loans Table */}
              <div className="card mb-6">
                <div className="card-header">
                  <h2 className="card-title">📖 Current Borrowed Books (UC7, UC9, UC12)</h2>
                  <span className="badge badge-purple">{activeLoans.length} Active</span>
                </div>
                {activeLoans.length === 0 ? (
                  <div className="empty-state" style={{ padding: 'var(--sp-6)' }}>
                    <div className="empty-state-icon">📖</div>
                    <div className="empty-state-title">No books currently borrowed</div>
                    <div className="empty-state-text">Explore the catalogue to borrow your next book.</div>
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Book Title</th>
                          <th>ISBN</th>
                          <th>Issue Date</th>
                          <th>Due Date</th>
                          <th>Renewals</th>
                          <th>Status</th>
                          <th>Fine</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeLoans.map(loan => (
                          <tr key={loan.id}>
                            <td><strong>{loan.bookTitle}</strong></td>
                            <td style={{ fontFamily: 'monospace' }}>{loan.bookIsbn}</td>
                            <td>{formatDate(loan.issueDate)}</td>
                            <td>{formatDate(loan.dueDate)}</td>
                            <td>{loan.renewalCount ?? 0} / 2</td>
                            <td>
                              {isOverdue(loan.dueDate)
                                ? <span className="badge badge-danger">Overdue</span>
                                : <span className="badge badge-success">On Schedule</span>}
                            </td>
                            <td>
                              {parseFloat(loan.fine) > 0 ? (
                                <span style={{ color: 'var(--clr-danger)', fontWeight: 600 }}>₹{loan.fine}</span>
                              ) : '₹0'}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                                <button
                                  id={`btn-renew-loan-${loan.id}`}
                                  className="btn btn-outline btn-sm"
                                  onClick={() => handleRenew(loan.id)}
                                  disabled={actionLoading || (loan.renewalCount ?? 0) >= 2}
                                  title="Renew borrowing period by 14 days"
                                >
                                  🔄 Renew
                                </button>
                                {parseFloat(loan.fine) > 0 && !loan.finePaid && (
                                  <button
                                    id={`btn-pay-fine-${loan.id}`}
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handlePayFine(loan.id)}
                                    disabled={actionLoading}
                                  >
                                    💳 Pay Fine
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

              {/* Reservations Section */}
              <div className="card mb-6">
                <div className="card-header">
                  <h2 className="card-title">📌 My Reservations Queue (UC10, UC11)</h2>
                  <span className="badge badge-teal">{activeReservations.length}</span>
                </div>
                {reservations.length === 0 ? (
                  <div className="empty-state" style={{ padding: 'var(--sp-6)' }}>
                    <div className="empty-state-icon">📌</div>
                    <div className="empty-state-title">No reservations placed</div>
                    <div className="empty-state-text">When a book has 0 copies available, you can reserve it.</div>
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Book</th>
                          <th>Reserved Date</th>
                          <th>Queue Position</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservations.map(res => (
                          <tr key={res.id}>
                            <td><strong>{res.bookTitle}</strong><br /><span style={{ fontSize: '0.8rem', color: 'var(--clr-text-2)' }}>{res.bookIsbn}</span></td>
                            <td>{formatDate(res.reservationDate)}</td>
                            <td>
                              {res.status === 'ACTIVE' ? (
                                <span className="badge badge-purple">#{res.queuePosition} in line</span>
                              ) : '—'}
                            </td>
                            <td>
                              <span className={`badge ${res.status === 'ACTIVE' ? 'badge-teal' : res.status === 'FULFILLED' ? 'badge-success' : 'badge-danger'}`}>
                                {res.status}
                              </span>
                            </td>
                            <td>
                              {res.status === 'ACTIVE' && (
                                <button
                                  id={`btn-cancel-res-${res.id}`}
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleCancelReservation(res.id)}
                                  disabled={actionLoading}
                                >
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Borrowing History */}
              {history.length > 0 && (
                <div className="card mb-6">
                  <div className="card-header">
                    <h2 className="card-title">📜 Borrowing History (UC12)</h2>
                    <span className="badge badge-outline">{history.length} Completed</span>
                  </div>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Book</th>
                          <th>Issued</th>
                          <th>Returned</th>
                          <th>Fine</th>
                          <th>Payment Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map(loan => (
                          <tr key={loan.id}>
                            <td><strong>{loan.bookTitle}</strong></td>
                            <td>{formatDate(loan.issueDate)}</td>
                            <td>{formatDate(loan.returnDate)}</td>
                            <td>{parseFloat(loan.fine) > 0 ? `₹${loan.fine}` : '₹0'}</td>
                            <td>
                              {parseFloat(loan.fine) <= 0 ? (
                                <span className="badge badge-success">No Fine</span>
                              ) : loan.finePaid ? (
                                <span className="badge badge-success">Paid</span>
                              ) : (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handlePayFine(loan.id)}
                                  disabled={actionLoading}
                                >
                                  Pay ₹{loan.fine}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Quick Book Reserve / Availability */}
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">📚 Library Catalog Highlights</h2>
                  <Link to="/catalogue" className="btn btn-ghost btn-sm">Full Catalog →</Link>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--sp-4)', padding: 'var(--sp-6)' }}>
                  {recentBooks.map(b => (
                    <div key={b.id} style={{ background: 'var(--clr-surface-2)', borderRadius: 'var(--radius)', padding: 'var(--sp-4)', border: '1px solid var(--clr-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '2rem', textAlign: 'center', marginBottom: 'var(--sp-2)' }}>📖</div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 2 }}>{b.title}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-2)', marginBottom: 'var(--sp-2)' }}>{b.author}</div>
                        <span className={`badge ${b.availableCopies > 0 ? 'badge-success' : 'badge-danger'}`} style={{ marginBottom: 'var(--sp-3)', display: 'inline-block' }}>
                          {b.availableCopies > 0 ? `${b.availableCopies} available` : 'All copies issued'}
                        </span>
                      </div>
                      {b.availableCopies === 0 && (
                        <button
                          id={`btn-reserve-book-${b.id}`}
                          className="btn btn-outline btn-sm w-full"
                          onClick={() => handleReserve(b.id)}
                          disabled={actionLoading}
                        >
                          📌 Reserve Copy
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
