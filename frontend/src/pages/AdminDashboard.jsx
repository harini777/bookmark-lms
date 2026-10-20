import React, { useEffect, useState } from 'react'
import { loanApi } from '../api/endpoints'
import Sidebar from '../components/Sidebar'
import Spinner from '../components/Spinner'
import Alert from '../components/Alert'

function formatDate(d) { return d ? new Date(d).toLocaleDateString() : '—' }

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [overdueLoans, setOverdueLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [s, o] = await Promise.all([
          loanApi.getDashboard(),
          loanApi.getOverdue(),
        ])
        setStats(s.data)
        setOverdueLoans(o.data)
      } catch {
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">📊 Admin Dashboard</h1>
            <p className="page-subtitle">Library overview and management</p>
          </div>
        </header>

        <div className="page-body">
          {error && <Alert type="error">{error}</Alert>}
          {loading ? <Spinner /> : stats && (
            <>
              <div className="stats-grid mb-8">
                <div className="stat-card">
                  <div className="stat-icon purple">📚</div>
                  <div>
                    <div className="stat-value">{stats.totalBooks}</div>
                    <div className="stat-label">Total Titles</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon teal">📦</div>
                  <div>
                    <div className="stat-value">{stats.totalCopies}</div>
                    <div className="stat-label">Total Copies</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon green">✅</div>
                  <div>
                    <div className="stat-value">{stats.availableBooks}</div>
                    <div className="stat-label">Titles Available</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon blue">👥</div>
                  <div>
                    <div className="stat-value">{stats.totalMembers}</div>
                    <div className="stat-label">Members</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon orange">📖</div>
                  <div>
                    <div className="stat-value">{stats.activeLoans}</div>
                    <div className="stat-label">Active Loans</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon red">⚠️</div>
                  <div>
                    <div className="stat-value">{stats.overdueLoans}</div>
                    <div className="stat-label">Overdue Loans</div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">⚠️ Overdue Loans</h2>
                  <span className="badge badge-danger">{overdueLoans.length}</span>
                </div>
                {overdueLoans.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">✅</div>
                    <div className="empty-state-title">No overdue loans</div>
                    <div className="empty-state-text">All books are within their due dates.</div>
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Member</th>
                          <th>Book</th>
                          <th>Due Date</th>
                          <th>Days Overdue</th>
                          <th>Fine</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overdueLoans.map(loan => {
                          const days = Math.floor((new Date() - new Date(loan.dueDate)) / 86400000)
                          return (
                            <tr key={loan.id}>
                              <td><strong>{loan.memberName}</strong><br /><span style={{ fontSize: '0.8rem', color: 'var(--clr-text-2)' }}>{loan.memberUsername}</span></td>
                              <td>{loan.bookTitle}</td>
                              <td style={{ color: 'var(--clr-danger)' }}>{formatDate(loan.dueDate)}</td>
                              <td><span className="badge badge-danger">{days} days</span></td>
                              <td>{parseFloat(loan.fine) > 0 ? `₹${loan.fine}` : '—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
