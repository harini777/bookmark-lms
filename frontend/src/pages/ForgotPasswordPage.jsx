import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/endpoints'
import Alert from '../components/Alert'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1) // 1 = find account, 2 = set new password
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!usernameOrEmail.trim()) {
      setError('Please enter your username or registered email')
      return
    }
    setLoading(true)
    setError('')
    try {
      await authApi.forgotPassword({ usernameOrEmail })
      setStep(2)
      setSuccess('Account verified. Please enter your new password.')
    } catch (err) {
      setError(err.response?.data?.message || 'No account matching this username or email found.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    try {
      await authApi.resetPassword({ usernameOrEmail, newPassword })
      setSuccess('Password reset successfully! Redirecting to login…')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🔑</div>
          <h1 className="auth-title">Recover Password (UC3)</h1>
          <p className="auth-subtitle">
            {step === 1 ? 'Verify your identity to reset password' : 'Enter your new account password'}
          </p>
        </div>

        {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        {step === 1 ? (
          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label className="form-label">Username or Registered Email</label>
              <input
                id="recover-input"
                className="form-control"
                placeholder="e.g. member1 or member1@bookmark.com"
                value={usernameOrEmail}
                onChange={e => setUsernameOrEmail(e.target.value)}
                required
              />
            </div>
            <button
              id="btn-verify-identity"
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Verifying…' : 'Verify Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset}>
            <div className="form-group">
              <label className="form-label">New Password (min 6 characters)</label>
              <input
                id="new-password-input"
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                id="confirm-password-input"
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button
              id="btn-submit-reset"
              type="submit"
              className="btn btn-success w-full"
              disabled={loading}
            >
              {loading ? 'Updating…' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="auth-footer" style={{ marginTop: 'var(--sp-4)', textAlign: 'center' }}>
          Remembered your password? <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  )
}
