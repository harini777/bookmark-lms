import React, { useEffect, useState, useCallback } from 'react'
import { bookApi, reservationApi } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Spinner from '../components/Spinner'
import Alert from '../components/Alert'
import ConfirmDialog from '../components/ConfirmDialog'

const EMPTY_FORM = {
  title: '', author: '', isbn: '', category: '',
  publisher: '', edition: '', publicationYear: '',
  language: 'English', shelfLocation: '',
  description: '', totalCopies: ''
}

function BookModal({ book, onClose, onSave }) {
  const [form, setForm] = useState(book ? {
    ...book,
    publisher: book.publisher || '',
    edition: book.edition || '',
    publicationYear: book.publicationYear || '',
    language: book.language || 'English',
    shelfLocation: book.shelfLocation || '',
    totalCopies: book.totalCopies
  } : { ...EMPTY_FORM })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const validate = () => {
    const e = {}
    if (!form.title?.trim()) e.title = 'Title is required'
    if (!form.author?.trim()) e.author = 'Author is required'
    if (!form.isbn?.trim()) e.isbn = 'ISBN is required'
    const copies = parseInt(form.totalCopies)
    if (form.totalCopies === '' || isNaN(copies)) e.totalCopies = 'Required'
    else if (copies < 0) e.totalCopies = 'Must be ≥ 0'
    return e
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setApiError('')
    try {
      const payload = {
        ...form,
        totalCopies: parseInt(form.totalCopies),
        publicationYear: form.publicationYear ? parseInt(form.publicationYear) : null
      }
      if (book) await bookApi.update(book.id, payload)
      else await bookApi.create(payload)
      onSave()
    } catch (err) {
      const data = err.response?.data
      if (data?.fieldErrors) setErrors(data.fieldErrors)
      else setApiError(data?.message ?? 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 650 }}>
        <div className="modal-header">
          <h2 className="modal-title">{book ? '✏️ Edit Book Record' : '➕ Add New Book (UC14)'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          {apiError && <Alert type="error">{apiError}</Alert>}
          <form id="book-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">Title <span className="required">*</span></label>
              <input id="book-title" name="title" className={`form-control${errors.title ? ' is-invalid' : ''}`}
                value={form.title} onChange={handleChange} placeholder="e.g. Clean Code" />
              {errors.title && <span className="form-error">{errors.title}</span>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Author <span className="required">*</span></label>
                <input id="book-author" name="author" className={`form-control${errors.author ? ' is-invalid' : ''}`}
                  value={form.author} onChange={handleChange} placeholder="Author name" />
                {errors.author && <span className="form-error">{errors.author}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">ISBN <span className="required">*</span></label>
                <input id="book-isbn" name="isbn" className={`form-control${errors.isbn ? ' is-invalid' : ''}`}
                  value={form.isbn} onChange={handleChange} placeholder="e.g. 978-0-13-235088-4" />
                {errors.isbn && <span className="form-error">{errors.isbn}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Publisher</label>
                <input id="book-publisher" name="publisher" className="form-control"
                  value={form.publisher} onChange={handleChange} placeholder="e.g. Prentice Hall" />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input id="book-category" name="category" className="form-control"
                  value={form.category} onChange={handleChange} placeholder="e.g. Computer Science" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Edition</label>
                <input id="book-edition" name="edition" className="form-control"
                  value={form.edition} onChange={handleChange} placeholder="e.g. 1st Edition" />
              </div>
              <div className="form-group">
                <label className="form-label">Publication Year</label>
                <input id="book-pub-year" name="publicationYear" type="number" className="form-control"
                  value={form.publicationYear} onChange={handleChange} placeholder="e.g. 2008" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Shelf Location</label>
                <input id="book-shelf" name="shelfLocation" className="form-control"
                  value={form.shelfLocation} onChange={handleChange} placeholder="e.g. A3-Shelf-2" />
              </div>
              <div className="form-group">
                <label className="form-label">Total Copies <span className="required">*</span></label>
                <input id="book-total-copies" name="totalCopies" type="number" min="0"
                  className={`form-control${errors.totalCopies ? ' is-invalid' : ''}`}
                  value={form.totalCopies} onChange={handleChange} placeholder="0" />
                {errors.totalCopies && <span className="form-error">{errors.totalCopies}</span>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea id="book-description" name="description" className="form-control" rows={3}
                value={form.description} onChange={handleChange} placeholder="Brief synopsis or notes" />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" id="btn-book-cancel" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" id="btn-book-save" form="book-form" type="submit" disabled={loading}>
            {loading ? '⏳ Saving…' : '💾 Save Book'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ViewBookModal({ book, onClose, onReserve, isMember }) {
  if (!book) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <h2 className="modal-title">📖 Book Details (UC5)</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)', marginBottom: 'var(--sp-4)' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-2)', textTransform: 'uppercase' }}>Title</div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{book.title}</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-2)', textTransform: 'uppercase' }}>Author</div>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>{book.author}</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-2)', textTransform: 'uppercase' }}>ISBN</div>
              <div style={{ fontFamily: 'monospace' }}>{book.isbn}</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-2)', textTransform: 'uppercase' }}>Category</div>
              <div>{book.category || 'General'}</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-2)', textTransform: 'uppercase' }}>Publisher</div>
              <div>{book.publisher || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-2)', textTransform: 'uppercase' }}>Edition / Year</div>
              <div>{book.edition || '—'} {book.publicationYear ? `(${book.publicationYear})` : ''}</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-2)', textTransform: 'uppercase' }}>Shelf Location</div>
              <div>{book.shelfLocation || 'Main Stack'}</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-2)', textTransform: 'uppercase' }}>Availability</div>
              <div>
                <span className={`badge ${book.availableCopies > 0 ? 'badge-success' : 'badge-danger'}`}>
                  {book.availableCopies} available / {book.totalCopies} total
                </span>
              </div>
            </div>
          </div>
          {book.description && (
            <div style={{ background: 'var(--clr-surface-2)', padding: 'var(--sp-4)', borderRadius: 'var(--radius)', border: '1px solid var(--clr-border)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-2)', marginBottom: 'var(--sp-1)' }}>Description</div>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>{book.description}</p>
            </div>
          )}
        </div>
        <div className="modal-footer">
          {isMember && book.availableCopies === 0 && (
            <button className="btn btn-primary" onClick={() => onReserve(book.id)}>
              📌 Reserve This Book (UC10)
            </button>
          )}
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default function CataloguePage() {
  const { user, isRole } = useAuth()
  const canManage = isRole('LIBRARIAN', 'ADMINISTRATOR')
  const isMember = isRole('MEMBER')

  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modal, setModal] = useState(null) // null | 'add' | book-object
  const [viewBook, setViewBook] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchBooks = useCallback(async () => {
    setLoading(true)
    try {
      const res = search
        ? await bookApi.search(search)
        : await bookApi.getAll()
      setBooks(res.data)
    } catch {
      setError('Failed to load books')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchBooks() }, [fetchBooks])

  const handleSearch = e => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const handleSave = () => {
    setModal(null)
    setSuccess('Book record saved successfully')
    fetchBooks()
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleDelete = async () => {
    try {
      await bookApi.delete(deleteTarget.id)
      setDeleteTarget(null)
      setSuccess('Book deleted successfully')
      fetchBooks()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Delete failed')
      setDeleteTarget(null)
    }
  }

  const handleReserve = async (bookId) => {
    try {
      await reservationApi.reserve(bookId)
      setSuccess('Book reserved successfully! You are in the reservation queue.')
      if (viewBook) setViewBook(null)
      fetchBooks()
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Reservation failed')
    }
  }

  // Extract unique categories
  const categories = ['ALL', ...new Set(books.map(b => b.category).filter(Boolean))]

  const filteredBooks = books.filter(b => {
    if (categoryFilter !== 'ALL' && b.category !== categoryFilter) return false
    return true
  })

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">📚 Book Catalogue</h1>
            <p className="page-subtitle">Search, browse, and manage library inventory (F9–F20)</p>
          </div>
          {canManage && (
            <button id="btn-add-book" className="btn btn-primary" onClick={() => setModal('add')}>
              ➕ Add Book (UC14)
            </button>
          )}
        </header>

        <div className="page-body">
          {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

          {/* Search and Filters */}
          <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap', marginBottom: 'var(--sp-6)', alignItems: 'center' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--sp-2)', flex: 1, minWidth: 280 }}>
              <div className="search-bar flex-1">
                <span className="search-icon">🔍</span>
                <input
                  id="book-search-input"
                  placeholder="Search by title, author, ISBN, publisher, category…"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                />
              </div>
              <button id="btn-book-search" type="submit" className="btn btn-primary">Search</button>
              {search && (
                <button type="button" className="btn btn-outline" onClick={() => { setSearch(''); setSearchInput('') }}>
                  Clear
                </button>
              )}
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
              <label style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-text-2)' }}>Category:</label>
              <select
                className="form-control"
                style={{ width: 'auto' }}
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {loading ? <Spinner /> : filteredBooks.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <div className="empty-state-title">No books found</div>
                <div className="empty-state-text">{search ? 'Try adjusting your search criteria.' : 'No books in this category.'}</div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Title & Details</th>
                      <th>Author</th>
                      <th>ISBN</th>
                      <th>Category</th>
                      <th>Location</th>
                      <th>Total</th>
                      <th>Available</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBooks.map(b => (
                      <tr key={b.id}>
                        <td>
                          <strong>{b.title}</strong>
                          {b.publisher && <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-2)' }}>{b.publisher}</div>}
                        </td>
                        <td>{b.author}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{b.isbn}</td>
                        <td>{b.category ? <span className="badge badge-purple">{b.category}</span> : '—'}</td>
                        <td>{b.shelfLocation || '—'}</td>
                        <td>{b.totalCopies}</td>
                        <td>
                          <span className={`badge ${b.availableCopies > 0 ? 'badge-success' : 'badge-danger'}`}>
                            {b.availableCopies} available
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                            <button
                              id={`btn-view-book-${b.id}`}
                              className="btn btn-ghost btn-sm"
                              onClick={() => setViewBook(b)}
                              title="View complete book information"
                            >
                              👁️ View
                            </button>
                            {isMember && b.availableCopies === 0 && (
                              <button
                                id={`btn-reserve-book-${b.id}`}
                                className="btn btn-outline btn-sm"
                                onClick={() => handleReserve(b.id)}
                                title="Reserve this unavailable book"
                              >
                                📌 Reserve
                              </button>
                            )}
                            {canManage && (
                              <>
                                <button
                                  id={`btn-edit-book-${b.id}`}
                                  className="btn btn-outline btn-sm"
                                  onClick={() => setModal(b)}
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  id={`btn-delete-book-${b.id}`}
                                  className="btn btn-danger btn-sm"
                                  onClick={() => setDeleteTarget(b)}
                                >
                                  🗑️ Delete
                                </button>
                              </>
                            )}
                          </div>
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

      {modal && (
        <BookModal
          book={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {viewBook && (
        <ViewBookModal
          book={viewBook}
          onClose={() => setViewBook(null)}
          onReserve={handleReserve}
          isMember={isMember}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Book (UC16)"
          message={`Are you sure you want to permanently delete "${deleteTarget.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          confirmLabel="Delete Book"
        />
      )}
    </div>
  )
}
