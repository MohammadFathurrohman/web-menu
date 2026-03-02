import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext()

const API = 'http://localhost:3001'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('authToken'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      verifyToken()
    } else {
      setLoading(false)
    }
  }, [])

  const verifyWithToken = async (tok) => {
    const res = await fetch(`${API}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` }
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.user || null
  }

  const fetchMe = async (tok) => {
    const res = await fetch(`${API}/users/me`, {
      headers: { 'Authorization': `Bearer ${tok}`, 'Content-Type': 'application/json' }
    })
    if (!res.ok) return null
    return await res.json()
  }

  const verifyToken = async () => {
    const savedToken = localStorage.getItem('authToken')
    if (!savedToken) { setLoading(false); return }
    try {
      // Try verifying current access token
      const userData = await verifyWithToken(savedToken)
      if (userData) {
        // Fetch full profile (includes email) after verify
        const fullUser = await fetchMe(savedToken)
        setUser(fullUser || userData)
      } else {
        // Access token expired/invalid — try refresh
        const newTok = await doRefresh()
        if (newTok) {
          const userData2 = await verifyWithToken(newTok)
          if (userData2) {
            const fullUser2 = await fetchMe(newTok)
            setUser(fullUser2 || userData2)
          } else clearAuth()
        } else {
          clearAuth()
        }
      }
    } catch {
      // network error — keep state as-is
    } finally {
      setLoading(false)
    }
  }

  const clearAuth = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('authToken')
    localStorage.removeItem('refreshToken')
  }

  const doRefresh = useCallback(async () => {
    const rt = localStorage.getItem('refreshToken')
    if (!rt) return null
    try {
      const res = await fetch(`${API}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt })
      })
      if (!res.ok) { clearAuth(); return null }
      const data = await res.json()
      setToken(data.accessToken)
      localStorage.setItem('authToken', data.accessToken)
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)
      return data.accessToken
    } catch {
      clearAuth()
      return null
    }
  }, [])

  const authFetch = useCallback(async (url, options = {}) => {
    const currentToken = localStorage.getItem('authToken')
    const makeRequest = (t) => fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${t}`,
        ...(options.headers || {})
      }
    })
    let res = await makeRequest(currentToken)
    if (res.status === 401) {
      const newToken = await doRefresh()
      if (!newToken) return res
      res = await makeRequest(newToken)
    }
    return res
  }, [doRefresh])

  const register = async (username, email, password, confirmPassword) => {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, confirmPassword })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.error || 'Registration failed')
    return data
  }

  const login = async (username, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.error || 'Login failed')
    const accessTok = data.accessToken || data.token
    setToken(accessTok)
    setUser(data.user)
    localStorage.setItem('authToken', accessTok)
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)
    return data
  }

  const logout = async () => {
    const rt = localStorage.getItem('refreshToken')
    try {
      if (rt) {
        await fetch(`${API}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: rt })
        })
      }
    } catch {}
    clearAuth()
  }

  const updateProfile = async ({ username, email, currentPassword, newPassword } = {}) => {
    const body = {}
    if (username !== undefined) body.username = username
    if (email !== undefined) body.email = email
    if (newPassword !== undefined) { body.newPassword = newPassword; body.currentPassword = currentPassword }
    const res = await authFetch(`${API}/users/me`, {
      method: 'PUT',
      body: JSON.stringify(body)
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Update failed')
    setUser(prev => ({ ...prev, username: data.username, email: data.email }))
    return data
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, authFetch, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}