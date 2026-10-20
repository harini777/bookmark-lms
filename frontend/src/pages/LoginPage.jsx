import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'
import Alert from '../components/Alert'

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.username || !form.password) {
      setError('Username and password are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data } = await authApi.login(form)
      login({ userId: data.userId, username: data.username, role: data.role, fullName: data.fullName }, data.token)
      if (data.role === 'MEMBER') navigate('/dashboard')
      else navigate('/admin/dashboard')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">📚</div>
          <h1 className="login-logo-title">Bookmark</h1>
          <p className="login-logo-sub">Digital Library Management System</p>
        </div>

        {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="login-username" className="form-label">
              Username <span className="required">*</span>
            </label>
            <input
              id="login-username"
              name="username"
              className="form-control"
              placeholder="Enter your username"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="login-password" className="form-label">
                Password <span className="required">*</span>
              </label>
              <Link to="/forgot-password" style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-primary)' }}>
                Forgot Password?
              </Link>
            </div>
            <input
              id="login-password"
              name="password"
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
          </div>

          <button
            id="btn-login"
            type="submit"
            className="btn btn-primary w-full btn-lg"
            style={{ marginTop: 'var(--sp-4)' }}
            disabled={loading}
          >
            {loading ? '⏳ Signing in…' : '🔐 Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 'var(--sp-6)', fontSize: 'var(--text-sm)', color: 'var(--clr-text-2)' }}>
          New member?{' '}
          <Link to="/register" style={{ color: 'var(--clr-primary)', fontWeight: 600 }}>
            Register here
          </Link>
        </p>

        <div style={{ marginTop: 'var(--sp-6)', padding: 'var(--sp-4)', background: 'var(--clr-surface-2)', borderRadius: 'var(--radius)', fontSize: 'var(--text-xs)', color: 'var(--clr-text-2)' }}>
          <strong>Demo accounts:</strong><br />
          admin / Admin@123 (Administrator)<br />
          librarian / Librarian@123 (Librarian)<br />
          member1 / Member@123 (Member)
        </div>
      </div>
    </div>
  )
}
