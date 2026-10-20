import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../api/endpoints'
import Alert from '../components/Alert'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '', phone: '' })
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const navigate = useNavigate()

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const validate = () => {
    const e = {}
    if (!form.username.trim()) e.username = 'Username is required'
    else if (form.username.length < 3) e.username = 'At least 3 characters'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'At least 6 characters'
    if (!form.fullName.trim()) e.fullName = 'Full name is required'
    return e
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    setApiError('')
    try {
      await authApi.register(form)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Registration failed'
      setApiError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="login-page">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--sp-4)' }}>✅</div>
          <h2 style={{ marginBottom: 'var(--sp-2)' }}>Registration Successful!</h2>
          <p style={{ color: 'var(--clr-text-2)' }}>Redirecting to login…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page" style={{ padding: 'var(--sp-8) var(--sp-6)' }}>
      <div className="login-card" style={{ maxWidth: 520 }}>
        <div className="login-logo">
          <div className="login-logo-icon">📝</div>
          <h1 className="login-logo-title">Create Account</h1>
          <p className="login-logo-sub">Join Bookmark Digital Library</p>
        </div>

        {apiError && <Alert type="error" onClose={() => setApiError('')}>{apiError}</Alert>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-fullname" className="form-label">Full Name <span className="required">*</span></label>
              <input id="reg-fullname" name="fullName" className={`form-control${errors.fullName ? ' is-invalid' : ''}`}
                placeholder="Your full name" value={form.fullName} onChange={handleChange} />
              {errors.fullName && <span className="form-error">{errors.fullName}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="reg-username" className="form-label">Username <span className="required">*</span></label>
              <input id="reg-username" name="username" className={`form-control${errors.username ? ' is-invalid' : ''}`}
                placeholder="Choose a username" value={form.username} onChange={handleChange} />
              {errors.username && <span className="form-error">{errors.username}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-email" className="form-label">Email <span className="required">*</span></label>
            <input id="reg-email" name="email" type="email" className={`form-control${errors.email ? ' is-invalid' : ''}`}
              placeholder="your@email.com" value={form.email} onChange={handleChange} />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-password" className="form-label">Password <span className="required">*</span></label>
              <input id="reg-password" name="password" type="password" className={`form-control${errors.password ? ' is-invalid' : ''}`}
                placeholder="Min 6 characters" value={form.password} onChange={handleChange} />
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="reg-phone" className="form-label">Phone</label>
              <input id="reg-phone" name="phone" className="form-control"
                placeholder="Optional" value={form.phone} onChange={handleChange} />
            </div>
          </div>

          <button id="btn-register" type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            {loading ? '⏳ Registering…' : '✅ Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 'var(--sp-5)', fontSize: 'var(--text-sm)', color: 'var(--clr-text-2)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--clr-primary)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
