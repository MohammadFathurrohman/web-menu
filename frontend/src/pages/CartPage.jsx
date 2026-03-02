import { useState } from 'react'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const API = 'http://localhost:3001'

export default function CartPage({ onBack }) {
  const { cart, removeFromCart, updateQty, clearCart, cartTotal } = useCart()
  const { authFetch, user } = useAuth()
  const [notes, setNotes] = useState('')
  const [placing, setPlacing] = useState(false)

  const handlePlaceOrder = async () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return }
    setPlacing(true)
    try {
      const res = await authFetch(`${API}/orders`, {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map(i => ({ menuItemId: i.id, quantity: i.quantity })),
          notes
        })
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message || 'Order failed'); return }
      clearCart()
      setNotes('')
      toast.success(`Order #${data.id} placed successfully!`)
      onBack()
    } catch { toast.error('Network error') }
    finally { setPlacing(false) }
  }

  return (
    <div className="min-h-screen bg-[var(--c-page)]">
      <header className="sticky top-0 z-50 bg-[var(--c-card)]/80 backdrop-blur-md border-b border-[var(--c-accent)]/30">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[var(--c-text)]">Your Cart</h1>
          <button onClick={onBack} className="text-[var(--c-accent)] hover:opacity-80 font-bold transition">Back to Menu</button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        {cart.length === 0 ? (
          <div className="text-center py-20 text-[var(--c-text-muted)]">
            <p className="text-5xl mb-4">🛒</p>
            <p className="text-xl">Your cart is empty</p>
            <button onClick={onBack} className="mt-6 bg-[var(--c-accent)] hover:opacity-90 text-white font-bold py-3 px-8 rounded-xl transition">
              Browse Menu
            </button>
          </div>
        ) : (
          <>
            {cart.map(item => (
              <div key={item.id} className="bg-[var(--c-card)] rounded-xl p-4 flex justify-between items-center border border-[var(--c-accent)]/20">
                <div>
                  <h3 className="font-bold text-[var(--c-text)]">{item.name}</h3>
                  <p className="text-[var(--c-accent)] font-bold">${parseFloat(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button onClick={() => updateQty(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-full bg-[var(--c-input)] hover:bg-[var(--c-accent)]/10 text-[var(--c-text)] font-bold flex items-center justify-center transition border border-[var(--c-accent)]/20"
                  >-</button>
                  <span className="text-[var(--c-text)] font-bold w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-full bg-[var(--c-input)] hover:bg-[var(--c-accent)]/10 text-[var(--c-text)] font-bold flex items-center justify-center transition border border-[var(--c-accent)]/20"
                  >+</button>
                  <button onClick={() => removeFromCart(item.id)}
                    className="ml-2 text-[var(--c-text-muted)] hover:text-[var(--c-text)] font-bold transition text-sm"
                  >Remove</button>
                </div>
              </div>
            ))}

            <div className="bg-[var(--c-card)] rounded-xl p-5 border border-[var(--c-accent)]/20">
              <label className="block text-[var(--c-text-muted)] font-bold mb-2">Order Notes (optional)</label>
              <textarea
                value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Allergies, special requests..."
                rows={3}
                className="w-full px-4 py-2 bg-[var(--c-input)] border border-[var(--c-accent)]/20 text-[var(--c-text)] rounded-lg focus:outline-none focus:border-[var(--c-accent)] resize-none transition"
              />
            </div>

            <div className="bg-[var(--c-card)] rounded-xl p-5 border border-[var(--c-accent)]/40">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[var(--c-text-muted)] font-bold text-lg">Total</span>
                <span className="text-2xl font-bold text-[var(--c-accent)]">${cartTotal.toFixed(2)}</span>
              </div>
              <button onClick={handlePlaceOrder} disabled={placing}
                className="w-full bg-gradient-to-r from-[var(--c-accent)] to-[var(--c-accent-light)] hover:opacity-90 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition text-lg"
              >{placing ? 'Placing Order...' : 'Place Order'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}



