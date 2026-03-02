import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState([])
  const [form, setForm] = useState({ name: '', description: '', price: '' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const { user, logout } = useAuth()

  useEffect(() => {
    fetchMenu()
  }, [])

  const fetchMenu = async () => {
    try {
      const res = await fetch('http://localhost:3001/menu')
      const data = await res.json()
      setMenuItems(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (editingId) {
        const res = await fetch(`http://localhost:3001/menu/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        })
        if (res.ok) {
          setEditingId(null)
        }
      } else {
        const res = await fetch('http://localhost:3001/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        })
        if (res.ok) {
          setForm({ name: '', description: '', price: '' })
        }
      }
      fetchMenu()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await fetch(`http://localhost:3001/menu/${id}`, { method: 'DELETE' })
        fetchMenu()
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleEdit = (item) => {
    setForm({ name: item.name, description: item.description, price: item.price })
    setEditingId(item.id)
  }

  return (
    <div className="min-h-screen bg-[var(--c-page)]">
      {/* Header */}
      <header className="bg-[var(--c-card)] shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[var(--c-accent)]">
              Menu Manager
            </h1>
            <p className="text-[var(--c-text-muted)]">Welcome, {user?.username}!</p>
          </div>
          <button
            onClick={logout}
            className="bg-[var(--c-card)] hover:bg-[var(--c-accent)]/10 border border-[var(--c-accent)]/30 text-[var(--c-text-muted)] font-bold py-2 px-6 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="bg-[var(--c-card)] rounded-2xl shadow-lg p-6 sticky top-8">
              <h2 className="text-2xl font-bold text-[var(--c-text)] mb-6">
                {editingId ? 'Edit Item' : 'Add New Item'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--c-text-label)] mb-2">
                    Item Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Pasta Carbonara"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-[var(--c-card)] bg-[var(--c-input)] rounded-lg focus:outline-none focus:border-[var(--c-accent)] transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--c-text-label)] mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Describe your item"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-[var(--c-card)] bg-[var(--c-input)] rounded-lg focus:outline-none focus:border-[var(--c-accent)] transition h-24"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--c-text-label)] mb-2">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-[var(--c-card)] bg-[var(--c-input)] rounded-lg focus:outline-none focus:border-[var(--c-accent)] transition"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-[var(--c-accent)] to-[var(--c-accent-light)] text-white font-bold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Item' : 'Add Item'}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null)
                      setForm({ name: '', description: '', price: '' })
                    }}
                    className="w-full bg-[var(--c-card)] text-[var(--c-text-muted)] font-bold py-3 rounded-lg hover:opacity-80 transition"
                  >
                    Cancel
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* Menu Items Section */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-[var(--c-text)]">Your Menu Items</h2>
              <p className="text-[var(--c-text-muted)]">Total: {menuItems.length} items</p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--c-accent)]"></div>
                <p className="text-[var(--c-text-muted)] mt-4">Loading menu...</p>
              </div>
            ) : menuItems.length === 0 ? (
              <div className="bg-[var(--c-card)] rounded-2xl shadow-lg p-12 text-center">
                <p className="text-[var(--c-text-muted)] text-lg">No menu items yet. Create your first one!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[var(--c-card)] rounded-2xl shadow-lg p-6 hover:shadow-xl transition transform hover:-translate-y-1"
                  >
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-[var(--c-text)]">{item.name}</h3>
                      <p className="text-[var(--c-text-muted)] text-sm mt-1">{item.description}</p>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-[var(--c-card)]">
                      <span className="text-2xl font-bold text-[var(--c-accent)]">
                        ${item.price}
                      </span>
                      <div className="space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="bg-[var(--c-accent)] hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-[var(--c-card)] hover:bg-[var(--c-accent)]/10 border border-[var(--c-accent)]/30 text-[var(--c-text-muted)] font-bold py-2 px-4 rounded-lg transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


