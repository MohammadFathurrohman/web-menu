import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { CartProvider, useCart } from './contexts/CartContext'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminPage from './pages/AdminPage'
import UserPage from './pages/UserPage'
import CartPage from './pages/CartPage'
function AppContent() {
  const { user, loading } = useAuth()
  const { cartCount } = useCart()
  const [page, setPage] = useState('login')
  const [view, setView] = useState('menu')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background:'var(--c-page)' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 mb-4" style={{ borderColor:'var(--c-accent)' }}></div>
          <p className="text-lg" style={{ color:'var(--c-accent)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    if (user.role === 'admin') {
      return <AdminPage />
    } else if (view === 'cart') {
      return <CartPage onBack={() => setView('menu')} />
    } else {
      return <UserPage onViewCart={() => setView('cart')} cartCount={cartCount} />
    }
  }

  return (
    <>
      {page === 'login' ? (
        <Login onSwitchToRegister={() => setPage('register')} />
      ) : (
        <Register onSwitchToLogin={() => setPage('login')} />
      )}
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <AppContent />
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}