import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const MEMBER_NAV = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/catalogue', icon: '📚', label: 'Book Catalogue' },
]

const LIBRARIAN_NAV = [
  { to: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/catalogue', icon: '📚', label: 'Book Catalogue' },
  { to: '/admin/loans', icon: '📋', label: 'Circulation & Loans' },
  { to: '/admin/members', icon: '👥', label: 'Member Accounts' },
  { to: '/admin/reports', icon: '📈', label: 'Reports & Analytics' },
]

const ADMIN_NAV = [
  { to: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/catalogue', icon: '📚', label: 'Book Catalogue' },
  { to: '/admin/loans', icon: '📋', label: 'Circulation & Loans' },
  { to: '/admin/members', icon: '👥', label: 'Member Accounts' },
  { to: '/admin/reports', icon: '📈', label: 'Reports & Analytics' },
  { to: '/admin/users', icon: '🛡️', label: 'User Roles' },
  { to: '/admin/backup', icon: '💾', label: 'Backup & Restore' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const navItems = user?.role === 'ADMINISTRATOR'
    ? ADMIN_NAV
    : user?.role === 'LIBRARIAN'
    ? LIBRARIAN_NAV
    : MEMBER_NAV

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">📚</div>
        <span className="sidebar-logo-text">Bookmark</span>
      </div>

      <span className="sidebar-section-label">Navigation</span>

      {navItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          <span className="nav-link-icon">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}

      <div className="sidebar-footer">
        <div className="user-badge">
          <div className="user-avatar">
            {user?.fullName?.[0] ?? user?.username?.[0] ?? '?'}
          </div>
          <div>
            <div className="user-name">{user?.fullName ?? user?.username}</div>
            <div className="user-role">{user?.role?.toLowerCase()}</div>
          </div>
        </div>
        <button className="btn btn-outline w-full" id="btn-logout" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>
    </aside>
  )
}
