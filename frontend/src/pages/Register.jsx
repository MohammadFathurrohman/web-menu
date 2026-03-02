import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Register({ onSwitchToLogin }) {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      await register(form.username, form.email, form.password, form.confirmPassword)
      setSuccess('Account created! Redirecting to login…')
      setTimeout(() => onSwitchToLogin(), 1800)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const fields = [
    { key: 'username', label: 'Username', type: 'text', placeholder: 'Choose a username' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'Enter your email' },
    { key: 'password', label: 'Password', type: showPw ? 'text' : 'password', placeholder: 'Create a password' },
    { key: 'confirmPassword', label: 'Confirm Password', type: showPw ? 'text' : 'password', placeholder: 'Confirm your password' },
  ]

  return (
    <div className="min-h-screen bg-[var(--c-page)] flex items-center justify-center px-4 py-8"
      style={{backgroundImage:'radial-gradient(ellipse at 80% 60%, var(--c-accent-glow) 0%, transparent 55%), radial-gradient(ellipse at 20% 30%, var(--c-accent-glow) 0%, transparent 55%)'}}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--c-accent)] to-[var(--c-accent-light)] shadow-lg shadow-[var(--c-accent)]/30 mb-4">
            <span className="text-3xl">✨</span>
          </div>
          <h1 className="text-3xl font-bold font-heading tracking-tight" style={{background:'linear-gradient(135deg,var(--c-accent-light),var(--c-accent))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Create Account</h1>
          <p className="text-[var(--c-text-muted)] mt-1 text-sm">Join us today</p>
        </div>

        <div className="bg-[var(--c-card)]/90 backdrop-blur-xl border border-[var(--c-accent-border)] rounded-2xl shadow-2xl shadow-black/10 p-8">
          {error && <div className="bg-[var(--c-accent)]/10 border border-[var(--c-accent-border)] text-[var(--c-accent)] px-4 py-3 rounded-xl mb-5 text-sm">{error}</div>}
          {success && <div className="bg-[var(--c-accent)]/10 border border-[var(--c-accent)]/30 text-[var(--c-accent)] px-4 py-3 rounded-xl mb-5 text-sm">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-[var(--c-text-muted)] mb-1.5">{f.label}</label>
                <div className="relative">
                  <input
                    type={f.type}
                    value={form[f.key]}
                    onChange={set(f.key)}
                    placeholder={f.placeholder}
                    required
                    className="w-full px-4 py-3 bg-[var(--c-input)] border border-[var(--c-accent-border)] rounded-xl text-[var(--c-text)] placeholder-[var(--c-text-muted)] focus:outline-none focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/15 transition"
                  />
                  {f.key === 'password' && (
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--c-text-muted)] hover:text-[var(--c-accent)] transition select-none"
                    >{showPw
                      ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7a9.97 9.97 0 016.347 2.247M15 12a3 3 0 11-6 0 3 3 0 016 0zm4.243-4.243L4.757 19.243"/></svg>
                      : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    }</button>
                  )}
                </div>
              </div>
            ))}

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-[var(--c-accent)] to-[var(--c-accent-light)] hover:from-[var(--c-accent-light)] hover:to-[var(--c-accent)] text-white font-bold py-3 rounded-xl shadow-lg shadow-[var(--c-accent)]/20 transition disabled:opacity-50 tracking-wide mt-2"
            >{loading ? 'Creating account…' : 'Create Account'}</button>
          </form>

          <p className="text-center text-[var(--c-text-muted)] text-sm mt-6">
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} className="text-[var(--c-accent)] font-semibold hover:text-[var(--c-accent)] transition">Login here</button>
          </p>
        </div>
      </div>
    </div>
  )
}





