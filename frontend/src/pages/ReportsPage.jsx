import React, { useEffect, useState } from 'react'
import { reportApi } from '../api/endpoints'
import Sidebar from '../components/Sidebar'
import Spinner from '../components/Spinner'
import Alert from '../components/Alert'

export default function ReportsPage() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    reportApi.getComprehensive()
      .then(res => setReport(res.data))
      .catch(() => setError('Failed to generate library reports'))
      .finally(() => setLoading(false))
  }, [])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">📈 Library Reports & Analytics (UC19)</h1>
            <p className="page-subtitle">Inventory, Circulation, Member Activity, and Fine Collection (F37–F40)</p>
          </div>
          <button className="btn btn-outline" onClick={handlePrint}>
            🖨️ Print / Export PDF
          </button>
        </header>

        <div className="page-body">
          {error && <Alert type="error">{error}</Alert>}
          {loading ? <Spinner /> : report && (
            <>
              {/* Summary Metrics */}
              <div className="stats-grid mb-8">
                <div className="stat-card">
                  <div className="stat-icon purple">📚</div>
                  <div>
                    <div className="stat-value">{report.totalTitles}</div>
                    <div className="stat-label">Total Titles (F37)</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon teal">📦</div>
                  <div>
                    <div className="stat-value">{report.totalCopies}</div>
                    <div className="stat-label">Total Volume Copies</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon green">✅</div>
                  <div>
                    <div className="stat-value">{report.availableCopies}</div>
                    <div className="stat-label">Available Copies</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon orange">📖</div>
                  <div>
                    <div className="stat-value">{report.issuedCopies}</div>
                    <div className="stat-label">Circulating Copies</div>
                  </div>
                </div>
              </div>

              {/* F38 Circulation & F40 Fine Collection Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-6)', marginBottom: 'var(--sp-6)' }}>
                {/* Circulation Report */}
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">🔄 Circulation Report (F38)</h2>
                  </div>
                  <div style={{ padding: 'var(--sp-6)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--sp-2) 0', borderBottom: '1px solid var(--clr-border)' }}>
                      <span>Total Checkouts Processed</span>
                      <strong>{report.totalLoansIssued}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--sp-2) 0', borderBottom: '1px solid var(--clr-border)' }}>
                      <span>Currently Active Checkouts</span>
                      <strong>{report.activeLoans}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--sp-2) 0', borderBottom: '1px solid var(--clr-border)' }}>
                      <span>Books Safely Returned</span>
                      <strong>{report.returnedLoans}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--sp-2) 0', borderBottom: '1px solid var(--clr-border)' }}>
                      <span>Overdue Loans</span>
                      <strong style={{ color: 'var(--clr-danger)' }}>{report.overdueLoans}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--sp-2) 0' }}>
                      <span>Active Reservations Queue</span>
                      <strong>{report.activeReservations}</strong>
                    </div>
                  </div>
                </div>

                {/* Fine Collection Report */}
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">💰 Fine Collection Report (F40)</h2>
                  </div>
                  <div style={{ padding: 'var(--sp-6)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--sp-2) 0', borderBottom: '1px solid var(--clr-border)' }}>
                      <span>Total Fines Incurred</span>
                      <strong>₹{report.totalFinesAssessed}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--sp-2) 0', borderBottom: '1px solid var(--clr-border)' }}>
                      <span>Fines Collected & Paid</span>
                      <strong style={{ color: 'var(--clr-success)' }}>₹{report.totalFinesCollected}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--sp-2) 0', borderBottom: '1px solid var(--clr-border)' }}>
                      <span>Outstanding / Pending Fines</span>
                      <strong style={{ color: 'var(--clr-danger)' }}>₹{report.totalFinesPending}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--sp-2) 0' }}>
                      <span>Standard Rate Applied</span>
                      <strong>₹10 / day overdue</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Breakdown (F37 Inventory) */}
              <div className="card mb-6">
                <div className="card-header">
                  <h2 className="card-title">📚 Category Inventory Breakdown (F37)</h2>
                </div>
                <div style={{ padding: 'var(--sp-6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--sp-4)' }}>
                  {Object.entries(report.categoryBreakdown || {}).map(([cat, count]) => (
                    <div key={cat} style={{ background: 'var(--clr-surface-2)', padding: 'var(--sp-4)', borderRadius: 'var(--radius)', border: '1px solid var(--clr-border)' }}>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-2)' }}>Genre / Category</div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>{cat}</div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-primary)', fontWeight: 700, marginTop: 4 }}>{count} Title{count !== 1 ? 's' : ''}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Member Activity Report (F39) */}
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">👥 Member Registration & Activity Report (F39)</h2>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Member ID</th>
                        <th>Name</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Account Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(report.memberSummary || []).map(m => (
                        <tr key={m.id}>
                          <td>#{m.id}</td>
                          <td><strong>{m.fullName}</strong></td>
                          <td>@{m.username}</td>
                          <td>{m.email}</td>
                          <td>
                            <span className={`badge ${m.status === 'APPROVED' || m.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
