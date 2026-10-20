import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import MemberDashboard from './pages/MemberDashboard'
import AdminDashboard from './pages/AdminDashboard'
import CataloguePage from './pages/CataloguePage'
import LoanManagementPage from './pages/LoanManagementPage'
import MembersPage from './pages/MembersPage'
import ReportsPage from './pages/ReportsPage'
import AdminUsersPage from './pages/AdminUsersPage'
import BackupRestorePage from './pages/BackupRestorePage'

function RootRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'MEMBER') return <Navigate to="/dashboard" replace />
  return <Navigate to="/admin/dashboard" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes (UC1, UC2, UC3) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Member portal (UC7, UC9, UC10, UC11, UC12, UC13) */}
          <Route element={<ProtectedRoute roles={['MEMBER']} />}>
            <Route path="/dashboard" element={<MemberDashboard />} />
            <Route path="/my-loans" element={<MemberDashboard />} />
          </Route>

          {/* Catalog access across all authenticated roles (UC4, UC5, UC6, UC14, UC15, UC16) */}
          <Route element={<ProtectedRoute roles={['MEMBER', 'LIBRARIAN', 'ADMINISTRATOR']} />}>
            <Route path="/catalogue" element={<CataloguePage />} />
          </Route>

          {/* Librarian & Administrator portal (UC7, UC8, UC17, UC18, UC19) */}
          <Route element={<ProtectedRoute roles={['LIBRARIAN', 'ADMINISTRATOR']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/loans" element={<LoanManagementPage />} />
            <Route path="/admin/members" element={<MembersPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
          </Route>

          {/* Administrator only portal (UC20, UC21) */}
          <Route element={<ProtectedRoute roles={['ADMINISTRATOR']} />}>
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/backup" element={<BackupRestorePage />} />
          </Route>

          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
