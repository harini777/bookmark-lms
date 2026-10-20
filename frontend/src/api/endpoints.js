import api from './axios'

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
}

export const bookApi = {
  getAll: () => api.get('/books'),
  getById: (id) => api.get(`/books/${id}`),
  search: (query) => api.get(`/books/search?query=${encodeURIComponent(query)}`),
  create: (data) => api.post('/books', data),
  update: (id, data) => api.put(`/books/${id}`, data),
  delete: (id) => api.delete(`/books/${id}`),
}

export const memberApi = {
  getAll: () => api.get('/members'),
  search: (query) => api.get(`/members/search?query=${encodeURIComponent(query)}`),
  getById: (id) => api.get(`/members/${id}`),
  getMe: () => api.get('/members/me'),
  update: (id, data) => api.put(`/members/${id}`, data),
  updateStatus: (id, status) => api.patch(`/members/${id}/status?status=${status}`),
}

export const loanApi = {
  issue: (data) => api.post('/loans/issue', data),
  return: (loanId) => api.patch(`/loans/${loanId}/return`),
  renew: (loanId) => api.patch(`/loans/${loanId}/renew`),
  payFine: (loanId) => api.patch(`/loans/${loanId}/pay-fine`),
  report: (loanId, status, penalty) => api.post(`/loans/${loanId}/report?status=${status}${penalty ? `&penalty=${penalty}` : ''}`),
  getActive: () => api.get('/loans/active'),
  getOverdue: () => api.get('/loans/overdue'),
  getMemberLoans: (memberId) => api.get(`/loans/member/${memberId}`),
  getMemberActiveLoans: (memberId) => api.get(`/loans/member/${memberId}/active`),
  getDashboard: () => api.get('/loans/dashboard'),
}

export const reservationApi = {
  reserve: (bookId) => api.post(`/reservations/book/${bookId}`),
  cancel: (id) => api.patch(`/reservations/${id}/cancel`),
  getMemberReservations: (memberId) => api.get(`/reservations/member/${memberId}`),
  getActive: () => api.get('/reservations/active'),
}

export const reportApi = {
  getComprehensive: () => api.get('/reports'),
}

export const adminApi = {
  getUsers: () => api.get('/admin/users'),
  updateRole: (id, role) => api.patch(`/admin/users/${id}/role?role=${role}`),
  getBackup: () => api.get('/admin/backup'),
  restore: (data) => api.post('/admin/restore', data),
}

