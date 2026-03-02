import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Hapus tema lama dari localStorage agar tidak menimpa theme.css
localStorage.removeItem('app-theme-v1')
// Bersihkan inline CSS vars yang mungkin tersisa dari sesi sebelumnya
const root = document.documentElement
;[
  '--c-page','--c-card','--c-input','--c-accent','--c-accent-light',
  '--c-accent-dim','--c-accent-border','--c-accent-glow',
  '--c-text','--c-text-muted','--c-text-label',
  '--c-tooltip-bg','--c-tooltip-border','--c-tooltip-text',
  '--c-pie-1','--c-pie-2','--c-pie-3','--c-pie-4','--c-pie-5','--c-pie-6',
  '--font-heading','--font-body',
].forEach(v => root.style.removeProperty(v))
// Apply dark/light class sebelum render agar tidak flicker
const savedTheme = localStorage.getItem('theme') || 'dark'
root.classList.toggle('dark', savedTheme === 'dark')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)