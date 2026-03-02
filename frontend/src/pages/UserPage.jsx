import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useTheme } from '../contexts/ThemeContext'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'

const API = 'http://localhost:3001'

const STATUS_META = {
  pending:   { label: 'Pending',   color: 'bg-[var(--s-pending-bg)]   text-[var(--s-pending-text)]   border-[var(--s-pending-border)]'  },
  completed: { label: 'Completed', color: 'bg-[var(--s-completed-bg)] text-[var(--s-completed-text)] border-[var(--s-completed-border)]' },
  cancelled: { label: 'Cancelled', color: 'bg-[var(--s-cancelled-bg)] text-[var(--s-cancelled-text)] border-[var(--s-cancelled-border)]' },
}

const inp = 'w-full px-4 py-2.5 bg-[var(--c-input)] border border-[var(--c-accent-border)] rounded-xl text-[var(--c-text)] placeholder-[var(--c-text-muted)] focus:outline-none focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/15 transition text-sm '

export default function UserPage({ onViewCart, cartCount }) {
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [maxPrice, setMaxPrice] = useState('')
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ username: '', email: '', currentPassword: '', newPassword: '', confirmPassword: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [userTab, setUserTab] = useState('menu') // 'menu' | 'history'
  const [myOrders, setMyOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const { user, logout, updateProfile, authFetch } = useAuth()
  const { addToCart } = useCart()
  const { theme, toggleTheme } = useTheme()
  const socketRef = useRef(null)
  const avatarRef = useRef(null)
  const [avatar, setAvatar] = useState(null)

  useEffect(() => { if (user?.username) setAvatar(localStorage.getItem(`avatar_${user.username}`) || null) }, [user?.username])

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result
      setAvatar(url)
      if (user?.username) localStorage.setItem(`avatar_${user.username}`, url)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = (e) => {
    e.stopPropagation()
    setAvatar(null)
    if (user?.username) localStorage.removeItem(`avatar_${user.username}`)
  }

  useEffect(() => {
    socketRef.current = io(API)
    socketRef.current.emit('join-user', user?.id)
    socketRef.current.on('order:status', ({ orderId, status }) => {
      toast(`Order #${orderId} is now: ${status}`, { icon: '🔔', duration: 5000, style: { background:'var(--c-tooltip-bg)', color:'var(--c-accent)', border:'1px solid var(--c-accent-border)' } })
    })
    return () => socketRef.current?.disconnect()
  }, [user?.id])

  useEffect(() => {
    Promise.all([fetchMenu(), fetchCategories(), fetchProfile()]).finally(() => setLoading(false))
  }, [])

  const fetchMenu = async () => {
    try {
      const res = await fetch(`${API}/menu/all`)
      const data = await res.json()
      setMenuItems(Array.isArray(data) ? data : (data.items || []))
    } catch { toast.error('Failed to load menu') }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API}/categories`)
      const data = await res.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch {}
  }

  const fetchProfile = async () => {
    try {
      const res = await authFetch(`${API}/users/me`)
      if (res.ok) {
        const data = await res.json()
        setProfileForm(prev => ({ ...prev, username: data.username || '', email: data.email || '' }))
      }
    } catch {}
  }

  const fetchMyOrders = async () => {
    setOrdersLoading(true)
    try {
      const res = await authFetch(`${API}/orders`)
      if (res.ok) { const data = await res.json(); setMyOrders(Array.isArray(data) ? data : []) }
    } catch { toast.error('Gagal memuat riwayat') }
    finally { setOrdersLoading(false) }
  }

  const handleAddToCart = (item) => {
    addToCart(item)
    toast.success(`${item.name} added to cart!`, { style: { background:'var(--c-card)', color:'var(--c-accent-light)', border:'1px solid var(--c-accent-border)' } })
  }

  const openProfileModal = async () => {
    try {
      const res = await authFetch(`${API}/users/me`)
      if (res.ok) {
        const data = await res.json()
        setProfileForm({ username: data.username || '', email: data.email || '', currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setProfileForm({ username: user?.username || '', email: user?.email || '', currentPassword: '', newPassword: '', confirmPassword: '' })
      }
    } catch {
      setProfileForm({ username: user?.username || '', email: user?.email || '', currentPassword: '', newPassword: '', confirmPassword: '' })
    }
    setEditingProfile(true)
  }

  const handleSaveProfile = async () => {
    const { username, email, currentPassword, newPassword, confirmPassword } = profileForm
    if (!username.trim() || username.trim().length < 2) { toast.error('Username must be at least 2 characters'); return }
    if (newPassword && newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return }
    if (newPassword && newPassword !== confirmPassword) { toast.error('Passwords do not match'); return }
    if (newPassword && !currentPassword) { toast.error('Enter current password to set a new one'); return }
    setSavingProfile(true)
    try {
      const payload = { username: username.trim(), email: email.trim() }
      if (newPassword) { payload.currentPassword = currentPassword; payload.newPassword = newPassword }
      await updateProfile(payload)
      toast.success('Profile updated!')
      setEditingProfile(false)
    } catch (err) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const filteredItems = menuItems.filter(item => {
    const ms = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               (item.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    const mc = selectedCategory === 'all' || item.category === selectedCategory
    const mp = !maxPrice || parseFloat(item.price) <= parseFloat(maxPrice)
    return ms && mc && mp
  })

  return (
    <div className="min-h-screen bg-[var(--c-page)] text-[var(--c-text)] transition-colors">

      {/* Profile Edit Modal */}
      {editingProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[var(--c-card)] border border-[var(--c-accent-border)] rounded-2xl shadow-2xl shadow-black/10 p-6 w-full max-w-md my-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xl font-bold font-heading" style={{background:'linear-gradient(135deg,var(--c-accent-light),var(--c-accent))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Edit Profile</h3>
                <p className="text-sm text-[var(--c-text-muted)]">Update your account information</p>
              </div>
              <button onClick={() => setEditingProfile(false)} className="text-[var(--c-text-muted)] hover:text-[var(--c-accent)] text-2xl leading-none">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--c-text-muted)] uppercase tracking-wide mb-1">Username</label>
                <input type="text" value={profileForm.username} onChange={e => setProfileForm({...profileForm, username: e.target.value})} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--c-text-muted)] uppercase tracking-wide mb-1">Email</label>
                <input type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} className={inp} />
              </div>
              <div className="pt-2 border-t border-[var(--c-accent-border)]">
                <p className="text-xs font-semibold text-[var(--c-text-muted)] uppercase tracking-wide mb-3">Change Password <span className="normal-case font-normal text-[var(--c-text-muted)]">(optional)</span></p>
                <div className="space-y-2">
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={profileForm.currentPassword} onChange={e => setProfileForm({...profileForm, currentPassword: e.target.value})}
                      placeholder="Current password" className={inp+' pr-10'} />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--c-text-muted)] hover:text-[var(--c-accent)] select-none">{showPass ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7a9.97 9.97 0 016.347 2.247M15 12a3 3 0 11-6 0 3 3 0 016 0zm4.243-4.243L4.757 19.243"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>}</button>
                  </div>
                  <input type={showPass ? 'text' : 'password'} value={profileForm.newPassword} onChange={e => setProfileForm({...profileForm, newPassword: e.target.value})}
                    placeholder="New password (min 6)" className={inp} />
                  <input type={showPass ? 'text' : 'password'} value={profileForm.confirmPassword} onChange={e => setProfileForm({...profileForm, confirmPassword: e.target.value})}
                    placeholder="Confirm new password" className={inp} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-5">
              <button onClick={() => setEditingProfile(false)} className="flex-1 py-2.5 border border-[var(--c-accent-border)] text-[var(--c-text-muted)] hover:border-[var(--c-accent)]/50 hover:text-[var(--c-accent)] rounded-xl transition font-semibold">Cancel</button>
              <button onClick={handleSaveProfile} disabled={savingProfile}
                className="flex-1 py-2.5 bg-gradient-to-r from-[var(--c-accent)] to-[var(--c-accent-light)] hover:from-[var(--c-accent-light)] hover:to-[var(--c-accent)] text-white font-bold rounded-xl shadow-md shadow-[var(--c-accent)]/20 transition disabled:opacity-50">
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--c-page)]/95 backdrop-blur border-b border-[var(--c-accent-border)] shadow-xl shadow-black/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative cursor-pointer group" onClick={() => avatarRef.current?.click()} title="Click to change photo">
              {avatar
                ? <img src={avatar} alt="avatar" className="w-9 h-9 rounded-xl object-cover shadow-md shadow-[var(--c-accent)]/30" />
                : <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--c-accent)] to-[var(--c-accent-light)] flex items-center justify-center text-sm font-bold text-white shadow-md shadow-[var(--c-accent)]/30">{user?.username?.[0]?.toUpperCase()||'U'}</div>
              }
              <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <span className="text-white text-xs">&#9998;</span>
              </div>
              {avatar && (
                <button onClick={handleRemoveAvatar} title="Remove photo"
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[var(--c-card)] border border-[var(--c-accent-border)] text-[var(--c-text-muted)] hover:text-[var(--c-accent)] text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10"
                >&times;</button>
              )}
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-[var(--c-accent)] to-[var(--c-accent-light)] bg-clip-text text-transparent leading-none">Menu</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-[var(--c-text-muted)] text-xs">Welcome, <span className="text-[var(--c-accent)] font-semibold">{user?.username}</span></p>
                <button onClick={openProfileModal} className="text-xs text-[var(--c-text-muted)] hover:text-[var(--c-accent)] transition" title="Edit profile">✏️</button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-lg bg-[var(--c-card)] border border-[var(--c-accent-border)] hover:border-[var(--c-accent)]/40 text-lg transition">{theme==='dark'?'☀️':'🌙'}</button>
            {/* Tab toggle */}
            <div className="flex rounded-xl border border-[var(--c-accent-border)] overflow-hidden bg-[var(--c-card)] text-sm font-bold">
              <button onClick={() => setUserTab('menu')} className={`px-3 py-2 transition ${userTab==='menu' ? 'bg-[var(--c-accent)] text-white' : 'text-[var(--c-text-muted)] hover:text-[var(--c-accent)]'}`}>Menu</button>
              <button onClick={() => { setUserTab('history'); fetchMyOrders() }} className={`px-3 py-2 transition ${userTab==='history' ? 'bg-[var(--c-accent)] text-white' : 'text-[var(--c-text-muted)] hover:text-[var(--c-accent)]'}`}>Riwayat</button>
            </div>
            <button onClick={onViewCart}
              className="relative bg-gradient-to-r from-[var(--c-accent)] to-[var(--c-accent-light)] hover:from-[var(--c-accent-light)] hover:to-[var(--c-accent)] text-white font-bold py-2 px-4 rounded-xl shadow-md shadow-[var(--c-accent)]/20 transition"
            >
              🛒 Cart
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[var(--c-input)] border border-[var(--c-accent)]/60 text-[var(--c-accent)] text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow">{cartCount}</span>
              )}
            </button>
            <button onClick={logout} className="bg-[var(--c-card)] hover:bg-[var(--c-card)]/80 border border-[var(--c-accent-border)] text-[var(--c-text-muted)] hover:text-[var(--c-accent)] font-bold py-2 px-4 rounded-xl transition text-sm">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {userTab === 'history' ? (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-[var(--c-text)]">Riwayat Pesanan</h2>
              <button onClick={fetchMyOrders} className="text-xs text-[var(--c-accent)] hover:underline flex items-center gap-1 border border-[var(--c-accent-border)] rounded-lg px-3 py-1.5 hover:border-[var(--c-accent)]/50 transition">↻ Refresh</button>
            </div>
            {ordersLoading ? (
              <div className="text-center py-20"><div className="inline-block w-12 h-12 rounded-full border-4 border-[var(--c-accent)] border-t-transparent animate-spin"></div></div>
            ) : myOrders.length === 0 ? (
              <div className="bg-[var(--c-card)] border border-[var(--c-accent-border)] rounded-2xl p-14 text-center">
                <p className="text-4xl mb-3">🧾</p>
                <p className="text-[var(--c-text-muted)]">Belum ada pesanan</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myOrders.map(order => {
                  const meta = STATUS_META[order.status] || { label: order.status, color: '' }
                  return (
                    <div key={order.id} className="bg-[var(--c-card)] border border-[var(--c-accent-border)] rounded-2xl p-5 hover:border-[var(--c-accent)]/30 transition">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${meta.color}`}>{meta.label}</span>
                          <span className="text-[var(--c-accent)] font-bold text-lg">${parseFloat(order.totalAmount||0).toFixed(2)}</span>
                        </div>
                        <span className="text-[var(--c-text-muted)] text-xs">{new Date(order.createdAt).toLocaleString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
                      </div>
                      {order.notes && <p className="text-[var(--c-text-muted)] text-xs italic mb-2">"{order.notes}"</p>}
                      <div className="flex flex-wrap gap-1.5">
                        {(order.items||[]).map((item, i) => (
                          <span key={i} className="text-xs bg-[var(--c-accent)]/10 text-[var(--c-accent)] border border-[var(--c-accent)]/20 px-2 py-0.5 rounded-full">{item.menuItemName} ×{item.quantity}</span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
        <>
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <input type="text" placeholder="Search menu..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-[var(--c-input)]  border border-[var(--c-accent-border)] rounded-xl text-[var(--c-text)] placeholder-[var(--c-text-muted)] focus:outline-none focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/15 transition text-sm" />
          <input type="number" placeholder="Max price $" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} min="0" step="0.01"
            className="w-40 px-4 py-2.5 bg-[var(--c-input)]  border border-[var(--c-accent-border)] rounded-xl text-[var(--c-text)] placeholder-[var(--c-text-muted)] focus:outline-none focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/15 transition text-sm" />
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mb-7">
          <button onClick={() => setSelectedCategory('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition border ${selectedCategory==='all' ? 'bg-[var(--c-accent)] border-[var(--c-accent)] text-white shadow-md shadow-[var(--c-accent)]/30' : 'border-[var(--c-accent-border)] text-[var(--c-accent)] dark:text-[var(--c-text-muted)] hover:border-[var(--c-accent)]/50 hover:text-[var(--c-accent)]'}`}
          >All</button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.name)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition border ${selectedCategory===cat.name ? 'bg-[var(--c-accent)] border-[var(--c-accent)] text-white shadow-md shadow-[var(--c-accent)]/30' : 'border-[var(--c-accent-border)] text-[var(--c-accent)] dark:text-[var(--c-text-muted)] hover:border-[var(--c-accent)]/50 hover:text-[var(--c-accent)]'}`}
            >{cat.icon} {cat.name}</button>
          ))}
          {categories.length === 0 && [...new Set(menuItems.map(i => i.category).filter(Boolean))].map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition border ${selectedCategory===cat ? 'bg-[var(--c-accent)] border-[var(--c-accent)] text-white shadow-md shadow-[var(--c-accent)]/30' : 'border-[var(--c-accent-border)] text-[var(--c-accent)] dark:text-[var(--c-text-muted)] hover:border-[var(--c-accent)]/50 hover:text-[var(--c-accent)]'}`}
            >{cat}</button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20"><div className="inline-block w-14 h-14 rounded-full border-4 border-[var(--c-accent)] border-t-transparent animate-spin"></div></div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-[var(--c-card)] border border-[var(--c-accent-border)] rounded-2xl p-14 text-center">
            <p className="text-[var(--c-text-muted)] text-lg">No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map(item => (
              <div key={item.id}
                className="group bg-[var(--c-card)] border border-[var(--c-accent-border)] rounded-2xl overflow-hidden hover:border-[var(--c-accent)]/50 shadow-lg hover:shadow-[var(--c-accent)]/10 transition-all hover:-translate-y-1"
              >
                {/* Photo */}
                {(() => { const img = localStorage.getItem(`menu_img_${item.id}`); const posRaw = localStorage.getItem(`menu_img_pos_${item.id}`); const pos = posRaw ? JSON.parse(posRaw) : { x: 50, y: 50 }; return img ? (
                  <div className="w-full h-40 overflow-hidden">
                    <img src={img} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" style={{ objectPosition: `${pos.x}% ${pos.y}%` }} />
                  </div>
                ) : (
                  <div className="w-full h-40 bg-[var(--c-input)] flex items-center justify-center border-b border-[var(--c-accent-border)]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1" className="text-[var(--c-text-muted)] opacity-40"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18a.75.75 0 00.75-.75V6.75A.75.75 0 0021 6H3a.75.75 0 00-.75.75v13.5c0 .414.336.75.75.75z"/></svg>
                  </div>
                )})()}
                <div className="p-5">
                  <div className="mb-2">
                    {item.category && (
                      <span className="text-xs bg-[var(--c-accent)]/15 text-[var(--c-accent)] border border-[var(--c-accent)]/30 px-2 py-0.5 rounded-full">{item.category}</span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-[var(--c-text)] group-hover:text-[var(--c-accent)] transition mb-1">{item.name}</h3>
                  <p className="text-[var(--c-accent)] dark:text-[var(--c-text-muted)] text-sm mb-4 line-clamp-2">{item.description}</p>
                  <div className="pt-4 border-t border-[var(--c-accent-border)] flex justify-between items-center">
                    <span className="text-xl font-bold text-[var(--c-accent)]">${parseFloat(item.price||0).toFixed(2)}</span>
                    <button onClick={() => handleAddToCart(item)}
                      className="bg-gradient-to-r from-[var(--c-accent)] to-[var(--c-accent-light)] hover:from-[var(--c-accent-light)] hover:to-[var(--c-accent)] text-white font-bold py-2 px-4 rounded-xl shadow-md shadow-[var(--c-accent)]/20 transition active:scale-95 text-sm"
                    >Add to Cart</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </> )} {/* end menu tab */}
      </div>

      <footer className="mt-16 border-t border-[var(--c-accent-border)] py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-[var(--c-text-muted)] text-sm">
          <p>© 2026 Menu System</p>
        </div>
      </footer>
    </div>
  )
}





