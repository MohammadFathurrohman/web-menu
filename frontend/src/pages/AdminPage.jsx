import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import ConfirmModal from '../components/ConfirmModal'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const API = 'http://localhost:3001'
const PIE_COLORS = ['var(--c-pie-1)','var(--c-pie-2)','var(--c-pie-3)','var(--c-pie-4)','var(--c-pie-5)','var(--c-pie-6)']

const STATUS_META = {
  pending:   { label: 'Pending',   color: 'bg-[var(--s-pending-bg)]   text-[var(--s-pending-text)]   border-[var(--s-pending-border)]'  },
  completed: { label: 'Completed', color: 'bg-[var(--s-completed-bg)] text-[var(--s-completed-text)] border-[var(--s-completed-border)]' },
  cancelled: { label: 'Cancelled', color: 'bg-[var(--s-cancelled-bg)] text-[var(--s-cancelled-text)] border-[var(--s-cancelled-border)]' },
}
const tooltipStyle = { background:'var(--c-tooltip-bg)', border:'1px solid var(--c-tooltip-border)', borderRadius:'8px', color:'var(--c-tooltip-text)' }
const STATUS_FLOW = ['pending','completed']
const inp = 'w-full px-4 py-2.5 bg-[var(--c-input)] border border-[var(--c-accent-border)] rounded-xl text-[var(--c-text)] placeholder-[var(--c-text-muted)] focus:outline-none focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/15 transition text-sm'
const btn = (variant='primary') => variant === 'primary'
  ? 'bg-gradient-to-r from-[var(--c-accent)] to-[var(--c-accent-light)] hover:from-[var(--c-accent-light)] hover:to-[var(--c-accent)] text-white font-bold rounded-xl shadow-md shadow-[var(--c-accent)]/20 transition disabled:opacity-50'
  : 'border border-[var(--c-accent)]/25 text-[var(--c-text-muted)] hover:border-[var(--c-accent)]/50 hover:text-[var(--c-accent)] rounded-xl transition'

export default function AdminPage() {
  const { user, logout, authFetch, updateProfile } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [menuItems, setMenuItems] = useState([])
  const [users, setUsers] = useState([])
  const [categories, setCategories] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [orderFilter, setOrderFilter] = useState('all')
  const today = new Date().toISOString().slice(0,10)
  const [analyticsStart, setAnalyticsStart] = useState(() => { const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().slice(0,10) })
  const [analyticsEnd, setAnalyticsEnd] = useState(() => new Date().toISOString().slice(0,10))
  const [activeTab, setActiveTab] = useState('orders')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '' })
  const [menuImg, setMenuImg] = useState(null) // base64 preview for current form
  const [menuImgPos, setMenuImgPos] = useState({ x: 50, y: 50 }) // objectPosition %
  const menuImgRef = useRef()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [confirm, setConfirm] = useState({ open: false, message: '', onConfirm: null })
  const [editingName, setEditingName] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [catForm, setCatForm] = useState({ name: '', icon: '🏷️', description: '' })
  const [catEditId, setCatEditId] = useState(null)
  const [catSubmitting, setCatSubmitting] = useState(false)
  const [userDetail, setUserDetail] = useState(null)
  const [userDetailLoading, setUserDetailLoading] = useState(false)
  const socketRef = useRef(null)
  const avatarRef = useRef(null)
  const [avatar, setAvatar] = useState(null)

  useEffect(() => {
    socketRef.current = io(API)
    socketRef.current.emit('join-admin')
    socketRef.current.on('order:new', (order) => {
      toast(`🔔 New order #${order.id} · $${parseFloat(order.totalAmount||0).toFixed(2)}`, { icon: '🔔', style: { background:'var(--c-tooltip-bg)', color:'var(--c-accent)', border:'1px solid var(--c-accent-border)' } })
      setOrders(prev => [order, ...prev])
    })
    socketRef.current.on('menu:updated', fetchMenu)
    return () => socketRef.current?.disconnect()
  }, [])

  useEffect(() => { if (user?.username) setAvatar(localStorage.getItem(`avatar_${user.username}`) || null) }, [user?.username])
  useEffect(() => { fetchData() }, [])
  useEffect(() => { if (activeTab === 'analytics') fetchAnalytics(analyticsStart, analyticsEnd) }, [activeTab])
  useEffect(() => { if (activeTab === 'orders') fetchOrders() }, [activeTab])

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

  const fetchData = async () => {
    await Promise.all([fetchMenu(), fetchUsers(), fetchCategories()])
    setLoading(false)
  }
  const fetchMenu = async () => {
    try { const res = await fetch(`${API}/menu/all`); const d = await res.json(); setMenuItems(Array.isArray(d) ? d : (d.items||[])) }
    catch { toast.error('Failed to load menu') }
  }
  const fetchUsers = async () => {
    try { const res = await authFetch(`${API}/users`); const d = await res.json(); setUsers(Array.isArray(d) ? d : []) }
    catch { toast.error('Failed to load users') }
  }
  const fetchCategories = async () => {
    try { const res = await fetch(`${API}/categories`); const d = await res.json(); setCategories(Array.isArray(d) ? d : []) }
    catch {}
  }
  const fetchOrders = async () => {
    setOrdersLoading(true)
    try {
      const res = await authFetch(`${API}/orders?limit=100`)
      const d = await res.json()
      setOrders(Array.isArray(d) ? d : (d.data || []))
    } catch { toast.error('Failed to load orders') }
    finally { setOrdersLoading(false) }
  }
  const fetchAnalytics = async (start, end) => {
    const s = start ?? analyticsStart
    const e = end ?? analyticsEnd
    try {
      const [summary, byDay, topItems, byStatus] = await Promise.all([
        authFetch(`${API}/analytics/summary`).then(r => r.json()),
        authFetch(`${API}/analytics/orders-by-day?start=${s}&end=${e}`).then(r => r.json()),
        authFetch(`${API}/analytics/top-items?start=${s}&end=${e}`).then(r => r.json()),
        authFetch(`${API}/analytics/orders-by-status?start=${s}&end=${e}`).then(r => r.json()),
      ])
      setAnalytics({ summary, byDay, topItems, byStatus })
    } catch { toast.error('Failed to load analytics') }
  }
  const fetchUserDetail = async (uid) => {
    setUserDetailLoading(true)
    try {
      const res = await authFetch(`${API}/users/${uid}`)
      const d = await res.json()
      setUserDetail(d)
    } catch { toast.error('Failed to load user detail') }
    finally { setUserDetailLoading(false) }
  }

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const res = await authFetch(`${API}/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) })
    if (res.ok) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      toast.success(`Order #${orderId} ? ${newStatus}`)
    } else toast.error('Status update failed')
  }

  const handleMenuImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => { setMenuImg(reader.result); setMenuImgPos({ x: 50, y: 50 }) }
    reader.readAsDataURL(file)
  }
  const handleRemoveMenuImage = () => {
    setMenuImg(null); setMenuImgPos({ x: 50, y: 50 })
    if (menuImgRef.current) menuImgRef.current.value = ''
  }
  const handleImgDragStart = (e) => {
    e.preventDefault()
    const startX = e.clientX, startY = e.clientY
    const startPosX = menuImgPos.x, startPosY = menuImgPos.y
    document.body.style.cursor = 'grabbing'
    const onMove = (ev) => {
      setMenuImgPos({
        x: Math.max(0, Math.min(100, startPosX + (ev.clientX - startX) / 3)),
        y: Math.max(0, Math.min(100, startPosY + (ev.clientY - startY) / 3))
      })
    }
    const onUp = () => { document.body.style.cursor = ''; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
  }

  const handleSubmitMenu = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      if (editingId) {
        setMenuItems(prev => prev.map(i => i.id === editingId ? { ...i, ...form } : i))
        const res = await authFetch(`${API}/menu/${editingId}`, { method: 'PUT', body: JSON.stringify(form) })
        if (!res.ok) { fetchMenu(); toast.error('Update failed') } else {
          if (menuImg !== null) { localStorage.setItem(`menu_img_${editingId}`, menuImg); localStorage.setItem(`menu_img_pos_${editingId}`, JSON.stringify(menuImgPos)) }
          toast.success('Item updated'); setEditingId(null)
        }
      } else {
        const res = await authFetch(`${API}/menu`, { method: 'POST', body: JSON.stringify(form) })
        if (res.ok) {
          const newItem = await res.json()
          if (menuImg) { localStorage.setItem(`menu_img_${newItem.id}`, menuImg); localStorage.setItem(`menu_img_pos_${newItem.id}`, JSON.stringify(menuImgPos)) }
          toast.success('Item added'); fetchMenu()
        }
        else { const d = await res.json(); toast.error(d.message || 'Add failed') }
      }
      setForm({ name: '', description: '', price: '', category: '' })
      setMenuImg(null); setMenuImgPos({ x: 50, y: 50 })
      if (menuImgRef.current) menuImgRef.current.value = ''
    } catch { toast.error('Network error') }
    finally { setSubmitting(false) }
  }
  const handleSaveUsername = async () => {
    if (!newUsername.trim() || newUsername.trim().length < 2) { toast.error('Min 2 characters'); return }
    setSavingName(true)
    try { await updateProfile({ username: newUsername.trim() }); toast.success('Username updated!'); setEditingName(false) }
    catch (err) { toast.error(err.message) }
    finally { setSavingName(false) }
  }
  const askDelete = (id, label) => setConfirm({ open: true, message: `Delete "${label}"?`, onConfirm: async () => {
    setConfirm({ open: false }); setMenuItems(prev => prev.filter(i => i.id !== id))
    const res = await authFetch(`${API}/menu/${id}`, { method: 'DELETE' })
    if (!res.ok) { fetchMenu(); toast.error('Delete failed') } else { localStorage.removeItem(`menu_img_${id}`); localStorage.removeItem(`menu_img_pos_${id}`); toast.success('Item deleted') }
  }})
  const askDeleteUser = (uid, uname) => setConfirm({ open: true, message: `Delete user "${uname}"?`, onConfirm: async () => {
    setConfirm({ open: false }); setUsers(prev => prev.filter(u => u.id !== uid))
    const res = await authFetch(`${API}/users/${uid}`, { method: 'DELETE' })
    if (!res.ok) { fetchUsers(); toast.error('Delete failed') } else toast.success('User deleted')
  }})
  const handleEditMenu = (item) => {
    setForm({ name: item.name, description: item.description||'', price: item.price, category: item.category||'' })
    setEditingId(item.id)
    setMenuImg(localStorage.getItem(`menu_img_${item.id}`) || null)
    try { const p = localStorage.getItem(`menu_img_pos_${item.id}`); setMenuImgPos(p ? JSON.parse(p) : { x: 50, y: 50 }) } catch { setMenuImgPos({ x: 50, y: 50 }) }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const handleChangeUserRole = async (userId, newRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    const res = await authFetch(`${API}/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role: newRole }) })
    if (!res.ok) { fetchUsers(); toast.error('Role update failed') } else toast.success('Role updated')
  }
  const handleSubmitCat = async (e) => {
    e.preventDefault(); if (!catForm.name.trim()) return toast.error('Name required'); setCatSubmitting(true)
    try {
      if (catEditId) {
        const res = await authFetch(`${API}/categories/${catEditId}`, { method: 'PUT', body: JSON.stringify(catForm) })
        if (res.ok) { const u = await res.json(); setCategories(prev => prev.map(c => c.id === catEditId ? u : c)); toast.success('Updated'); setCatEditId(null) }
        else { const d = await res.json(); toast.error(d.message||'Failed') }
      } else {
        const res = await authFetch(`${API}/categories`, { method: 'POST', body: JSON.stringify(catForm) })
        if (res.ok) { const n = await res.json(); setCategories(prev => [...prev, n].sort((a,b) => a.name.localeCompare(b.name))); toast.success('Added') }
        else { const d = await res.json(); toast.error(d.message||'Failed') }
      }
      setCatForm({ name:'', icon:'🏷️', description:'' })
    } catch { toast.error('Network error') } finally { setCatSubmitting(false) }
  }
  const handleEditCat = (cat) => { setCatForm({ name: cat.name, icon: cat.icon||'🏷️', description: cat.description||'' }); setCatEditId(cat.id) }
  const askDeleteCat = (cat) => setConfirm({ open: true, message: `Delete category "${cat.name}"?`, onConfirm: async () => {
    setConfirm({ open: false })
    const res = await authFetch(`${API}/categories/${cat.id}`, { method: 'DELETE' })
    if (res.ok) { setCategories(prev => prev.filter(c => c.id !== cat.id)); toast.success('Deleted'); fetchMenu() }
    else { const d = await res.json(); toast.error(d.message||'Failed') }
  }})

  const allCats = ['all', ...new Set([...categories.map(c => c.name), ...menuItems.map(i => i.category).filter(Boolean)])]
  const filtered = menuItems.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()) && (filterCat === 'all' || i.category === filterCat))
  const filteredOrders = orders.filter(o => orderFilter === 'all' || o.status === orderFilter)
  useEffect(() => { if (orderFilter !== 'all' && !orders.some(o => o.status === orderFilter)) setOrderFilter('all') }, [orders])

  const TABS = [
    { id:'orders', label:' Orders' },
    { id:'menu', label:'️ Menu' },
    { id:'categories', label:'️ Categories' },
    { id:'users', label:' Users' },
    { id:'analytics', label:' Analytics' },
  ]

  return (
    <div className="min-h-screen bg-[var(--c-page)] text-[var(--c-text)] transition-colors">
      <ConfirmModal isOpen={confirm.open} message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm({ open: false })} />

      {/* Edit Username Modal */}
      {editingName && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[var(--c-card)] border border-[var(--c-accent-border)] rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-[var(--c-text)] mb-1">Edit Username</h3>
            <p className="text-sm text-[var(--c-text-muted)] mb-4">Choose a new display name</p>
            <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)}
              onKeyDown={e => { if(e.key==='Enter') handleSaveUsername(); if(e.key==='Escape') setEditingName(false) }}
              placeholder="New username" autoFocus className={inp+' mb-4'}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setEditingName(false)} className={`px-4 py-2 ${btn('secondary')}`}>Cancel</button>
              <button onClick={handleSaveUsername} disabled={savingName} className={`px-4 py-2 ${btn()}`}>{savingName ? '...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {userDetail !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[var(--c-card)] border border-[var(--c-accent-border)] rounded-2xl shadow-2xl p-6 w-full max-w-md">
            {userDetailLoading ? (
              <div className="text-center py-8"><div className="inline-block w-10 h-10 rounded-full border-4 border-[var(--c-accent)] border-t-transparent animate-spin"></div></div>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--c-accent)] to-[var(--c-accent-light)] flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-[var(--c-accent)]/30">
                    {userDetail.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[var(--c-text)]">{userDetail.username}</h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${userDetail.role === 'admin' ? 'bg-[var(--c-accent)]/20 text-[var(--c-accent)]' : 'bg-[var(--c-accent)]/20 text-[var(--c-accent)]'}`}>{userDetail.role}</span>
                  </div>
                  <button onClick={() => setUserDetail(null)} className="ml-auto text-[var(--c-text-muted)] hover:text-[var(--c-accent)] text-2xl leading-none">×</button>
                </div>
                <div className="space-y-3 mb-5">
                  {[
                    { label: 'Email', value: userDetail.email || '—' },
                    { label: 'User ID', value: `#${userDetail.id}` },
                    { label: 'Joined', value: userDetail.createdAt ? new Date(userDetail.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }) : '—' },
                    { label: 'Total Orders', value: userDetail.orderCount ?? 0 },
                    { label: 'Total Spent', value: `$${parseFloat(userDetail.totalSpent||0).toFixed(2)}` },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between items-center py-2 border-b border-[var(--c-accent-border)]">
                      <span className="text-sm text-[var(--c-text-muted)]">{r.label}</span>
                      <span className="text-sm font-semibold text-[var(--c-text)]">{r.value}</span>
                    </div>
                  ))}
                </div>
                {userDetail.recentOrders?.length > 0 && (
                  <div>
                    <p className="text-xs text-[var(--c-text-muted)] uppercase tracking-widest font-semibold mb-2">Recent Orders</p>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {userDetail.recentOrders.map(o => (
                        <div key={o.id} className="flex justify-between items-center bg-[var(--c-accent)]/5 border border-[var(--c-accent-border)] rounded-lg px-3 py-1.5">
                          <span className="text-xs text-[var(--c-text-muted)]">#{o.id} · {new Date(o.createdAt).toLocaleDateString()}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-1.5 py-0.5 rounded border ${(STATUS_META[o.status]||STATUS_META.pending).color}`}>{o.status}</span>
                            <span className="text-xs font-bold text-[var(--c-accent)]">${parseFloat(o.totalAmount||0).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={() => setUserDetail(null)} className={`mt-5 w-full py-2 ${btn()} text-sm`}>Close</button>
              </>
            )}
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
                : <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--c-accent)] to-[var(--c-accent-light)] flex items-center justify-center text-sm font-bold text-white shadow-md shadow-[var(--c-accent)]/30">{user?.username?.[0]?.toUpperCase()||'A'}</div>
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
              <h1 className="text-xl font-bold bg-gradient-to-r from-[var(--c-accent)] to-[var(--c-accent-light)] bg-clip-text text-transparent leading-none">Admin Dashboard</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[var(--c-text-muted)] text-xs">Logged in as <span className="text-[var(--c-accent)] font-semibold">{user?.username}</span></p>
                <button onClick={() => { setNewUsername(user?.username||''); setEditingName(true) }} className="text-xs text-[var(--c-text-muted)] hover:text-[var(--c-accent)] transition">✏️</button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-lg bg-[var(--c-card)] border border-[var(--c-accent-border)] hover:border-[var(--c-accent)]/40 text-lg transition">{theme==='dark'?'☀️':'🌙'}</button>
            <button onClick={logout} className="bg-[var(--c-card)] hover:bg-[var(--c-accent)]/10 border border-[var(--c-accent)]/30 text-[var(--c-text-muted)] font-bold py-1.5 px-4 rounded-lg transition text-sm">Logout</button>
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto pb-0">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`py-2.5 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'border-[var(--c-accent)] text-[var(--c-accent)]'
                  : 'border-transparent text-[var(--c-text-muted)] hover:text-[var(--c-accent)]'
              }`}
            >{tab.label}</button>
          ))}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-20"><div className="inline-block w-14 h-14 rounded-full border-4 border-[var(--c-accent)] border-t-transparent animate-spin"></div></div>

        ) : activeTab === 'orders' ? (
          <div>
            {/* Status filter */}
            <div className="flex flex-wrap gap-2 mb-5">
              {['all', ...Object.keys(STATUS_META).filter(s => orders.some(o => o.status === s))].map(s => {
                const meta = s !== 'all' ? STATUS_META[s] : null
                return (
                  <button key={s} onClick={() => setOrderFilter(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                      orderFilter === s
                        ? s === 'all'
                          ? 'bg-[var(--c-accent)] border-[var(--c-accent)] text-white'
                          : `${meta.color}`
                        : 'border-[var(--c-accent-border)] text-[var(--c-text-muted)] hover:border-[var(--c-accent)]/40 hover:text-[var(--c-accent)]'
                    }`}
                  >{s === 'all' ? 'All Orders' : meta.label} {s !== 'all' && <span className="ml-1 opacity-70">({orders.filter(o=>o.status===s).length})</span>}</button>
                )
              })}
              <button onClick={fetchOrders} className="ml-auto px-3 py-1.5 rounded-full text-xs border border-[var(--c-accent-border)] text-[var(--c-text-muted)] hover:text-[var(--c-accent)] transition">↻ Refresh</button>
            </div>

            {ordersLoading ? (
              <div className="text-center py-12"><div className="inline-block w-10 h-10 rounded-full border-4 border-[var(--c-accent)] border-t-transparent animate-spin"></div></div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-16 text-[var(--c-text-muted)]">
                <p className="text-4xl mb-3">📦</p>
                <p>{orderFilter === 'all' ? 'No orders yet.' : `No ${orderFilter} orders.`}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map(order => {
                  const meta = STATUS_META[order.status] || STATUS_META.pending
                  const nextIdx = STATUS_FLOW.indexOf(order.status)
                  const nextStatus = nextIdx >= 0 && nextIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[nextIdx + 1] : null
                  return (
                    <div key={order.id} className="bg-[var(--c-card)] border border-[var(--c-accent-border)] rounded-2xl p-5 hover:border-[var(--c-accent)]/30 transition">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-[var(--c-text)] font-bold">Order</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${meta.color}`}>{meta.label}</span>
                            <span className="text-[var(--c-accent)] font-bold">${parseFloat(order.totalAmount||0).toFixed(2)}</span>
                          </div>
                          <p className="text-[var(--c-text-muted)] text-sm">👤 {order.user?.username || 'Unknown'} · {new Date(order.createdAt).toLocaleString()}</p>
                          {order.notes && <p className="text-[var(--c-text-muted)] text-xs mt-1 italic">"{order.notes}"</p>}
                          {order.items && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {order.items.map((it, i) => (
                                <span key={i} className="text-xs bg-[var(--c-accent)]/10 border border-[var(--c-accent-border)] text-[var(--c-accent)] px-2 py-0.5 rounded-lg">
                                  {it.menuItemName} ×{it.quantity}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 shrink-0">
                          {nextStatus && (
                            <button onClick={() => handleUpdateOrderStatus(order.id, nextStatus)}
                              className="bg-[var(--c-accent)]/20 hover:bg-[var(--c-accent)]/30 border border-[var(--c-accent)]/40 text-[var(--c-accent)] text-xs font-bold px-3 py-1.5 rounded-lg transition">
                              → {STATUS_META[nextStatus]?.label}
                            </button>
                          )}
                          {order.status !== 'cancelled' && order.status !== 'completed' && (
                            <button onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                              className="bg-[var(--c-card)] hover:bg-[var(--c-accent)]/10 border border-[var(--c-accent)]/30 text-[var(--c-text-muted)] text-xs font-bold px-3 py-1.5 rounded-lg transition">
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        ) : activeTab === 'menu' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-[var(--c-card)] border border-[var(--c-accent-border)] rounded-2xl p-6 sticky top-28">
                <h2 className="text-lg font-bold text-[var(--c-text)] mb-4">{editingId ? '✏️ Edit Item' : '+ Add Item'}</h2>
                <form onSubmit={handleSubmitMenu} className="space-y-3">
                  {[{f:'name',t:'text'},{f:'description',t:'text'},{f:'price',t:'number'}].map(({f,t}) => (
                    <div key={f}>
                      <label className="block text-xs font-semibold text-[var(--c-text-muted)] uppercase tracking-wide mb-1 capitalize">{f}</label>
                      <input type={t} step={f==='price'?'0.01':undefined} value={form[f]} onChange={e => setForm({...form,[f]:e.target.value})}
                        className={inp} required={f!=='description'} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--c-text-muted)] uppercase tracking-wide mb-1">Category</label>
                    <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className={inp}>
                      <option value="">None</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
                    </select>
                  </div>
                  {/* Image upload */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--c-text-muted)] uppercase tracking-wide mb-1">Photo</label>
                    {menuImg ? (
                      <div className="relative w-full h-36 rounded-xl overflow-hidden border border-[var(--c-accent-border)] group select-none">
                        <img
                          src={menuImg} alt="preview" draggable={false}
                          className="w-full h-full object-cover cursor-grab active:cursor-grabbing"
                          style={{ objectPosition: `${menuImgPos.x}% ${menuImgPos.y}%` }}
                          onMouseDown={handleImgDragStart}
                        />
                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                          Drag to reposition
                        </div>
                        <button type="button" onClick={handleRemoveMenuImage}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow opacity-0 group-hover:opacity-100 transition">×</button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[var(--c-accent-border)] rounded-xl cursor-pointer hover:border-[var(--c-accent)] hover:bg-[var(--c-accent)]/5 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-[var(--c-text-muted)] mb-1"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18v-1.5M16.5 12L12 7.5m0 0L7.5 12M12 7.5V18"/></svg>
                        <span className="text-xs text-[var(--c-text-muted)]">Upload photo</span>
                        <input ref={menuImgRef} type="file" accept="image/*" className="hidden" onChange={handleMenuImageChange} />
                      </label>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="submit" disabled={submitting} className={`flex-1 py-2.5 ${btn()}`}>{submitting ? '...' : editingId ? 'Update' : 'Add Item'}</button>
                    {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({name:'',description:'',price:'',category:''}); setMenuImg(null); setMenuImgPos({ x: 50, y: 50 }); if(menuImgRef.current) menuImgRef.current.value='' }} className={`px-4 py-2.5 ${btn('secondary')}`}>Cancel</button>}
                  </div>
                </form>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-2 mb-4">
                <input type="text" placeholder="Search items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={inp+' flex-1 min-w-[160px]'} />
                <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className={inp+' w-auto'}>
                  {allCats.map(c => <option key={c} value={c}>{c==='all'?'All':c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                {filtered.map(item => (
                  <div key={item.id} className="bg-[var(--c-card)] border border-[var(--c-accent-border)] rounded-xl p-4 flex justify-between items-center hover:border-[var(--c-accent)]/30 transition">
                    <div className="flex items-center gap-3">
                      {(() => { const img = localStorage.getItem(`menu_img_${item.id}`); const posRaw = localStorage.getItem(`menu_img_pos_${item.id}`); const pos = posRaw ? JSON.parse(posRaw) : { x: 50, y: 50 }; return img ? (
                        <img src={img} alt={item.name} className="w-14 h-14 object-cover rounded-lg border border-[var(--c-accent-border)] shrink-0" style={{ objectPosition: `${pos.x}% ${pos.y}%` }} />
                      ) : (
                        <div className="w-14 h-14 rounded-lg border border-dashed border-[var(--c-accent-border)] bg-[var(--c-input)] flex items-center justify-center shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-[var(--c-text-muted)]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18a.75.75 0 00.75-.75V6.75A.75.75 0 0021 6H3a.75.75 0 00-.75.75v13.5c0 .414.336.75.75.75z"/></svg>
                        </div>
                      )})()}
                      <div>
                        <p className="font-semibold text-[var(--c-text)]">{item.name}</p>
                        <p className="text-[var(--c-text-muted)] text-xs line-clamp-1 max-w-xs">{item.description}</p>
                        {item.category && <span className="text-xs bg-[var(--c-accent)]/15 text-[var(--c-accent)] border border-[var(--c-accent)]/30 px-1.5 py-0.5 rounded-full">{item.category}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <span className="text-[var(--c-accent)] font-bold">${parseFloat(item.price||0).toFixed(2)}</span>
                      <button onClick={() => handleEditMenu(item)} className="text-xs bg-[var(--c-accent)]/15 hover:bg-[var(--c-accent)]/25 border border-[var(--c-accent)]/30 text-[var(--c-accent)] font-bold py-1 px-2.5 rounded-lg transition">Edit</button>
                      <button onClick={() => askDelete(item.id, item.name)} className="text-xs bg-[var(--c-card)] hover:bg-[var(--c-accent)]/10 border border-[var(--c-accent)]/30 text-[var(--c-text-muted)] font-bold py-1 px-2.5 rounded-lg transition">Del</button>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && <div className="text-center py-12 text-[var(--c-text-muted)]">No items found</div>}
              </div>
            </div>
          </div>

        ) : activeTab === 'categories' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-[var(--c-card)] border border-[var(--c-accent-border)] rounded-2xl p-6 sticky top-28">
                <h2 className="text-lg font-bold text-[var(--c-text)] mb-4">{catEditId ? '✏️ Edit Category' : '+ Add Category'}</h2>
                <form onSubmit={handleSubmitCat} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--c-text-muted)] uppercase tracking-wide mb-1">Name *</label>
                    <input type="text" value={catForm.name} onChange={e => setCatForm({...catForm, name:e.target.value})} placeholder="e.g. Drinks" className={inp} required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--c-text-muted)] uppercase tracking-wide mb-1">Description</label>
                    <textarea value={catForm.description} onChange={e => setCatForm({...catForm, description:e.target.value})} rows={2} className={inp+' resize-none'} />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="submit" disabled={catSubmitting} className={`flex-1 py-2.5 ${btn()}`}>{catSubmitting ? '...' : catEditId ? 'Update' : 'Add'}</button>
                    {catEditId && <button type="button" onClick={() => { setCatEditId(null); setCatForm({name:'',icon:'🏷️',description:''}) }} className={`px-4 py-2.5 ${btn('secondary')}`}>Cancel</button>}
                  </div>
                </form>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="bg-[var(--c-card)] border border-[var(--c-accent-border)] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--c-accent-border)] flex justify-between items-center">
                  <h2 className="font-bold text-[var(--c-text)]">Categories <span className="text-[var(--c-text-muted)] font-normal text-sm">({categories.length})</span></h2>
                </div>
                {categories.length === 0 ? (
                  <div className="p-12 text-center text-[var(--c-text-muted)]"><p className="text-4xl mb-3">🗂️</p><p>No categories yet.</p></div>
                ) : (
                  <ul className="divide-y divide-blue-500/10">
                    {categories.map(cat => {
                      const count = menuItems.filter(i => i.category === cat.name).length
                      return (
                        <li key={cat.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--c-accent)]/5 transition">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{cat.icon||'🏷️'}</span>
                            <div>
                              <p className="font-semibold text-[var(--c-text)] text-sm">{cat.name}</p>
                              {cat.description && <p className="text-[var(--c-text-muted)] text-xs">{cat.description}</p>}
                              <p className="text-xs text-[var(--c-text-muted)] mt-0.5">{count} item{count!==1?'s':''}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0 ml-3">
                            <button onClick={() => handleEditCat(cat)} className="text-xs bg-[var(--c-accent)]/15 hover:bg-[var(--c-accent)]/25 border border-[var(--c-accent)]/30 text-[var(--c-accent)] font-bold py-1 px-2.5 rounded-lg transition">Edit</button>
                            <button onClick={() => askDeleteCat(cat)} className="text-xs bg-[var(--c-card)] hover:bg-[var(--c-accent)]/10 border border-[var(--c-accent)]/30 text-[var(--c-text-muted)] font-bold py-1 px-2.5 rounded-lg transition">Del</button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>

        ) : activeTab === 'users' ? (
          <div className="bg-[var(--c-card)] border border-[var(--c-accent-border)] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--c-accent-border)]">
              <h2 className="font-bold text-[var(--c-text)]">Users <span className="text-[var(--c-text-muted)] font-normal text-sm">({users.length})</span></h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--c-input)]">
                  <tr>{['Username','Email','Role','Joined','Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-bold text-[var(--c-text-muted)] uppercase tracking-wider">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-blue-500/10">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-[var(--c-accent)]/5 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--c-accent)] to-[var(--c-accent-light)] flex items-center justify-center text-sm font-bold text-white">
                            {u.username?.[0]?.toUpperCase()}
                          </div>
                          <span className="font-semibold text-[var(--c-text)] text-sm">{u.username}</span>
                          {u.id === user?.id && <span className="text-xs bg-[var(--c-accent)]/20 text-[var(--c-accent)] border border-[var(--c-accent)]/30 px-1.5 py-0.5 rounded-full">YOU</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[var(--c-text-muted)] text-sm">{u.email}</td>
                      <td className="px-5 py-3.5">
                        <select value={u.role} onChange={e => handleChangeUserRole(u.id, e.target.value)} disabled={u.id === user?.id}
                          className={`px-2 py-1 rounded-lg text-xs font-bold border ${u.role==='admin'?'bg-[var(--c-accent)]/20 text-[var(--c-accent)] border-[var(--c-accent)]/40':'bg-[var(--c-card)] text-[var(--c-text-muted)] border-[var(--c-accent-border)]'} ${u.id===user?.id?'opacity-50 cursor-not-allowed':'cursor-pointer'} bg-transparent`}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-5 py-3.5 text-[var(--c-text-muted)] text-xs">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-2">
                          <button onClick={() => { setUserDetail({}); fetchUserDetail(u.id) }}
                            className="text-xs bg-[var(--c-accent)]/15 hover:bg-[var(--c-accent)]/25 border border-[var(--c-accent)]/30 text-[var(--c-accent)] font-bold py-1 px-2.5 rounded-lg transition">View</button>
                          <button onClick={() => askDeleteUser(u.id, u.username)} disabled={u.id === user?.id}
                            className="text-xs bg-[var(--c-input)] hover:bg-[var(--c-accent)]/10 border border-[var(--c-accent-border)] text-[var(--c-text-muted)] font-bold py-1 px-2.5 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed">Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        ) : !analytics ? (
          <div className="text-center py-16"><div className="inline-block w-12 h-12 rounded-full border-4 border-[var(--c-accent)] border-t-transparent animate-spin"></div></div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label:'Total Orders', value: analytics.summary.totalOrders ?? 0, accent:'text-[var(--c-accent)]' },
                { label:'Revenue', value: `$${parseFloat(analytics.summary.totalRevenue||0).toFixed(2)}`, accent:'text-[var(--c-accent)]' },
                { label:'Total Users', value: analytics.summary.totalUsers ?? 0, accent:'text-[var(--c-accent)]' },
                { label:'Menu Items', value: analytics.summary.totalMenuItems ?? 0, accent:'text-[var(--c-accent)]' },
              ].map(card => (
                <div key={card.label} className="bg-[var(--c-card)] border border-[var(--c-accent-border)] rounded-2xl p-5 text-center">
                  <div className={`text-2xl font-bold ${card.accent}`}>{card.value}</div>
                  <div className="text-xs text-[var(--c-text-muted)] uppercase tracking-wider mt-1">{card.label}</div>
                  <div className="text-[10px] text-[var(--c-text-muted)] opacity-50 mt-0.5">All time</div>
                </div>
              ))}
            </div>
            <div className="bg-[var(--c-card)] border border-[var(--c-accent-border)] rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="font-bold text-[var(--c-text)]">Orders <span className="text-xs font-normal text-[var(--c-text-muted)]">({analyticsStart} → {analyticsEnd})</span></h3>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-xs text-[var(--c-text-muted)]">From</label>
                  <input type="date" value={analyticsStart} max={analyticsEnd}
                    onChange={e => setAnalyticsStart(e.target.value)}
                    className="text-xs rounded-lg border border-[var(--c-accent-border)] bg-[var(--c-input)] text-[var(--c-text)] px-2 py-1 focus:outline-none focus:border-[var(--c-accent)]"
                  />
                  <label className="text-xs text-[var(--c-text-muted)]">To</label>
                  <input type="date" value={analyticsEnd} min={analyticsStart} max={today}
                    onChange={e => setAnalyticsEnd(e.target.value)}
                    className="text-xs rounded-lg border border-[var(--c-accent-border)] bg-[var(--c-input)] text-[var(--c-text)] px-2 py-1 focus:outline-none focus:border-[var(--c-accent)]"
                  />
                  <button onClick={() => { setAnalytics(null); fetchAnalytics(analyticsStart, analyticsEnd) }}
                    className="text-xs px-3 py-1 rounded-lg bg-[var(--c-accent)] text-white font-bold hover:opacity-90 transition"
                  >Apply</button>
                </div>
              </div>
              {analytics.byDay?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analytics.byDay}>
                    <XAxis dataKey="date" tick={{ fill:'var(--c-accent)', fontSize:10 }} />
                    <YAxis tick={{ fill:'var(--c-accent)', fontSize:10 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill="var(--c-accent)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-10 text-[var(--c-text-muted)]">No orders in the selected date range.</div>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {analytics.byStatus?.length > 0 && (
                <div className="bg-[var(--c-card)] border border-[var(--c-accent-border)] rounded-2xl p-6">
                  <h3 className="font-bold text-[var(--c-text)] mb-4">Orders by Status</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={analytics.byStatus.map(r => ({ ...r, count: Number(r.count) }))}
                        dataKey="count" nameKey="status" cx="50%" cy="45%" outerRadius={85}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                          const RADIAN = Math.PI / 180
                          const radius = innerRadius + (outerRadius - innerRadius) * 0.5
                          const x = cx + radius * Math.cos(-midAngle * RADIAN)
                          const y = cy + radius * Math.sin(-midAngle * RADIAN)
                          return percent > 0.05 ? (
                            <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
                              {`${(percent*100).toFixed(0)}%`}
                            </text>
                          ) : null
                        }}
                        labelLine={false}
                      >
                        {analytics.byStatus.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v, name) => [Number(v), name]} contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize:12, color:'var(--c-accent)', paddingTop:8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              {analytics.topItems?.length > 0 && (
                <div className="bg-[var(--c-card)] border border-[var(--c-accent-border)] rounded-2xl p-6">
                  <h3 className="font-bold text-[var(--c-text)] mb-4">Top Items</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={analytics.topItems} layout="vertical">
                      <XAxis type="number" tick={{ fill:'var(--c-accent)', fontSize:10 }} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fill:'var(--c-accent)', fontSize:10 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="totalQuantity" fill="var(--c-accent)" radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            {!analytics.byStatus?.length && !analytics.topItems?.length && (
              <div className="text-center py-16 text-[var(--c-text-muted)]">No order data yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}














