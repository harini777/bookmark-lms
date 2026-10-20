import React, { useEffect, useState, useCallback } from 'react'
import { adminApi, memberApi } from '../api/endpoints'
import Sidebar from '../components/Sidebar'
import Spinner from '../components/Spinner'
import Alert from '../components/Alert'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminApi.getUsers()
      setUsers(res.data)
    } catch {
      setError('Failed to load user accounts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(true)
    setError('')
    try {
      await adminApi.updateRole(userId, newRole)
      setSuccess(`Role updated to ${newRole} successfully!`)
      fetchUsers()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to update role')
    } finally {
      setActionLoading(false)
    }
  }

  const handleStatusChange = async (userId, newStatus) => {
    setActionLoading(true)
    setError('')
    try {
      await memberApi.updateStatus(userId, newStatus)
      setSuccess(`Account status updated to ${newStatus}`)
      fetchUsers()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to update status')
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
            <h1 className="page-title">🛡️ User Role Management (UC20)</h1>
            <p className="page-subtitle">Configure Role-Based Access Control (RBAC) & permissions (F41)</p>
          </div>
        </header>

        <div className="page-body">
          {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

          {loading ? <Spinner /> : (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Registered Accounts ({users.length})</h2>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Full Name</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Current Role</th>
                      <th>Account Status</th>
                      <th>Change Role (UC20)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>#{u.id}</td>
                        <td><strong>{u.fullName}</strong></td>
                        <td>@{u.username}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`badge ${u.role === 'ADMINISTRATOR' ? 'badge-danger' : u.role === 'LIBRARIAN' ? 'badge-purple' : 'badge-outline'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <select
                            className="form-control"
                            style={{ padding: '3px 8px', fontSize: '0.8rem', width: 'auto' }}
                            value={u.status}
                            onChange={e => handleStatusChange(u.id, e.target.value)}
                            disabled={actionLoading}
                          >
                            <option value="APPROVED">APPROVED</option>
                            <option value="PENDING">PENDING</option>
                            <option value="SUSPENDED">SUSPENDED</option>
                            <option value="REJECTED">REJECTED</option>
                            <option value="EXPIRED">EXPIRED</option>
                          </select>
                        </td>
                        <td>
                          <select
                            id={`role-select-${u.id}`}
                            className="form-control"
                            style={{ padding: '3px 8px', fontSize: '0.8rem', width: 'auto' }}
                            value={u.role}
                            onChange={e => handleRoleChange(u.id, e.target.value)}
                            disabled={actionLoading}
                          >
                            <option value="MEMBER">MEMBER</option>
                            <option value="LIBRARIAN">LIBRARIAN</option>
                            <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                          </select>
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
