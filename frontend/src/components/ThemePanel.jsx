import { useState, useEffect } from 'react'

// ── Preset Themes ────────────────────────────────────────────────────────────
const PRESETS = [
  {
    name: 'Navy Gold', emoji: '🥇',
    vars: {
      '--c-page':'#080c14','--c-card':'#0d1117','--c-input':'#0a0e18',
      '--c-accent':'#f59e0b','--c-accent-light':'#fde68a',
      '--c-text':'#fef9ee','--c-text-muted':'rgba(245,158,11,0.50)','--c-text-label':'rgba(245,158,11,0.72)',
      '--c-pie-1':'#f59e0b','--c-pie-2':'#d97706','--c-pie-3':'#b45309',
      '--c-pie-4':'#fbbf24','--c-pie-5':'#fde68a','--c-pie-6':'#92400e',
    },
    font: { heading:'Playfair Display', body:'Inter' },
  },
  {
    name: 'Rose', emoji: '🌹',
    vars: {
      '--c-page':'#0f0408','--c-card':'#180a10','--c-input':'#120308',
      '--c-accent':'#f43f5e','--c-accent-light':'#fda4af',
      '--c-text':'#fff0f2','--c-text-muted':'rgba(244,63,94,0.50)','--c-text-label':'rgba(244,63,94,0.72)',
      '--c-pie-1':'#f43f5e','--c-pie-2':'#e11d48','--c-pie-3':'#be123c',
      '--c-pie-4':'#fb7185','--c-pie-5':'#fda4af','--c-pie-6':'#9f1239',
    },
    font: { heading:'Playfair Display', body:'Inter' },
  },
  {
    name: 'Emerald', emoji: '💚',
    vars: {
      '--c-page':'#020f06','--c-card':'#071a0e','--c-input':'#061209',
      '--c-accent':'#10b981','--c-accent-light':'#6ee7b7',
      '--c-text':'#f0fdf4','--c-text-muted':'rgba(16,185,129,0.48)','--c-text-label':'rgba(16,185,129,0.70)',
      '--c-pie-1':'#10b981','--c-pie-2':'#059669','--c-pie-3':'#047857',
      '--c-pie-4':'#34d399','--c-pie-5':'#6ee7b7','--c-pie-6':'#064e3b',
    },
    font: { heading:'Playfair Display', body:'Inter' },
  },
  {
    name: 'Purple', emoji: '💜',
    vars: {
      '--c-page':'#07040f','--c-card':'#10091a','--c-input':'#0c0614',
      '--c-accent':'#a855f7','--c-accent-light':'#e9d5ff',
      '--c-text':'#fdf4ff','--c-text-muted':'rgba(168,85,247,0.48)','--c-text-label':'rgba(168,85,247,0.70)',
      '--c-pie-1':'#a855f7','--c-pie-2':'#9333ea','--c-pie-3':'#7c3aed',
      '--c-pie-4':'#c084fc','--c-pie-5':'#e9d5ff','--c-pie-6':'#581c87',
    },
    font: { heading:'Cinzel', body:'Lato' },
  },
  {
    name: 'Sky Blue', emoji: '🔵',
    vars: {
      '--c-page':'#030d1a','--c-card':'#071527','--c-input':'#050f1e',
      '--c-accent':'#38bdf8','--c-accent-light':'#bae6fd',
      '--c-text':'#f0f9ff','--c-text-muted':'rgba(56,189,248,0.48)','--c-text-label':'rgba(56,189,248,0.70)',
      '--c-pie-1':'#38bdf8','--c-pie-2':'#0ea5e9','--c-pie-3':'#0284c7',
      '--c-pie-4':'#7dd3fc','--c-pie-5':'#bae6fd','--c-pie-6':'#0c4a6e',
    },
    font: { heading:'Montserrat', body:'Poppins' },
  },
  {
    name: 'Silver', emoji: '⚪',
    vars: {
      '--c-page':'#080a0c','--c-card':'#10151a','--c-input':'#0c1015',
      '--c-accent':'#94a3b8','--c-accent-light':'#e2e8f0',
      '--c-text':'#f1f5f9','--c-text-muted':'rgba(148,163,184,0.50)','--c-text-label':'rgba(148,163,184,0.72)',
      '--c-pie-1':'#94a3b8','--c-pie-2':'#64748b','--c-pie-3':'#475569',
      '--c-pie-4':'#cbd5e1','--c-pie-5':'#e2e8f0','--c-pie-6':'#1e293b',
    },
    font: { heading:'Raleway', body:'DM Sans' },
  },
  {
    name: 'Teal', emoji: '🌊',
    vars: {
      '--c-page':'#020f0e','--c-card':'#071a17','--c-input':'#061210',
      '--c-accent':'#14b8a6','--c-accent-light':'#99f6e4',
      '--c-text':'#f0fdfa','--c-text-muted':'rgba(20,184,166,0.48)','--c-text-label':'rgba(20,184,166,0.70)',
      '--c-pie-1':'#14b8a6','--c-pie-2':'#0d9488','--c-pie-3':'#0f766e',
      '--c-pie-4':'#2dd4bf','--c-pie-5':'#99f6e4','--c-pie-6':'#134e4a',
    },
    font: { heading:'Montserrat', body:'DM Sans' },
  },
  {
    name: 'Amber', emoji: '🔶',
    vars: {
      '--c-page':'#0f0800','--c-card':'#1a0f00','--c-input':'#140a00',
      '--c-accent':'#f97316','--c-accent-light':'#fed7aa',
      '--c-text':'#fff7ed','--c-text-muted':'rgba(249,115,22,0.50)','--c-text-label':'rgba(249,115,22,0.72)',
      '--c-pie-1':'#f97316','--c-pie-2':'#ea580c','--c-pie-3':'#c2410c',
      '--c-pie-4':'#fb923c','--c-pie-5':'#fed7aa','--c-pie-6':'#7c2d12',
    },
    font: { heading:'Bebas Neue', body:'Poppins' },
  },
  {
    name: 'Indigo', emoji: '🌌',
    vars: {
      '--c-page':'#04050f','--c-card':'#080b1a','--c-input':'#060814',
      '--c-accent':'#6366f1','--c-accent-light':'#c7d2fe',
      '--c-text':'#eef2ff','--c-text-muted':'rgba(99,102,241,0.48)','--c-text-label':'rgba(99,102,241,0.70)',
      '--c-pie-1':'#6366f1','--c-pie-2':'#4f46e5','--c-pie-3':'#4338ca',
      '--c-pie-4':'#818cf8','--c-pie-5':'#c7d2fe','--c-pie-6':'#312e81',
    },
    font: { heading:'Josefin Sans', body:'Inter' },
  },
  {
    name: 'Crimson', emoji: '🍷',
    vars: {
      '--c-page':'#0d0003','--c-card':'#180007','--c-input':'#120005',
      '--c-accent':'#dc2626','--c-accent-light':'#fca5a5',
      '--c-text':'#fff5f5','--c-text-muted':'rgba(220,38,38,0.48)','--c-text-label':'rgba(220,38,38,0.70)',
      '--c-pie-1':'#dc2626','--c-pie-2':'#b91c1c','--c-pie-3':'#991b1b',
      '--c-pie-4':'#ef4444','--c-pie-5':'#fca5a5','--c-pie-6':'#7f1d1d',
    },
    font: { heading:'Cinzel', body:'Lato' },
  },
  {
    name: 'Coffee', emoji: '☕',
    vars: {
      '--c-page':'#0a0805','--c-card':'#16120c','--c-input':'#110e09',
      '--c-accent':'#d97706','--c-accent-light':'#fde68a',
      '--c-text':'#fefce8','--c-text-muted':'rgba(217,119,6,0.50)','--c-text-label':'rgba(217,119,6,0.72)',
      '--c-pie-1':'#d97706','--c-pie-2':'#b45309','--c-pie-3':'#92400e',
      '--c-pie-4':'#f59e0b','--c-pie-5':'#fde68a','--c-pie-6':'#78350f',
    },
    font: { heading:'Libre Baskerville', body:'Inter' },
  },
  {
    name: 'Cyan', emoji: '💎',
    vars: {
      '--c-page':'#020c12','--c-card':'#07161e','--c-input':'#051018',
      '--c-accent':'#22d3ee','--c-accent-light':'#a5f3fc',
      '--c-text':'#ecfeff','--c-text-muted':'rgba(34,211,238,0.48)','--c-text-label':'rgba(34,211,238,0.70)',
      '--c-pie-1':'#22d3ee','--c-pie-2':'#06b6d4','--c-pie-3':'#0891b2',
      '--c-pie-4':'#67e8f9','--c-pie-5':'#a5f3fc','--c-pie-6':'#164e63',
    },
    font: { heading:'Montserrat', body:'Nunito' },
  },
  {
    name: 'Neon', emoji: '⚡',
    vars: {
      '--c-page':'#020402','--c-card':'#060c06','--c-input':'#040804',
      '--c-accent':'#22c55e','--c-accent-light':'#86efac',
      '--c-text':'#f0fdf4','--c-text-muted':'rgba(34,197,94,0.50)','--c-text-label':'rgba(34,197,94,0.72)',
      '--c-pie-1':'#22c55e','--c-pie-2':'#16a34a','--c-pie-3':'#15803d',
      '--c-pie-4':'#4ade80','--c-pie-5':'#86efac','--c-pie-6':'#14532d',
    },
    font: { heading:'Josefin Sans', body:'Inter' },
  },
  {
    name: 'Light', emoji: '☀️',
    vars: {
      '--c-page':'#f8f9fa','--c-card':'#ffffff','--c-input':'#f1f3f5',
      '--c-accent':'#7c3aed','--c-accent-light':'#ddd6fe',
      '--c-text':'#1e1b4b','--c-text-muted':'rgba(124,58,237,0.55)','--c-text-label':'rgba(124,58,237,0.75)',
      '--c-pie-1':'#7c3aed','--c-pie-2':'#6d28d9','--c-pie-3':'#5b21b6',
      '--c-pie-4':'#8b5cf6','--c-pie-5':'#a78bfa','--c-pie-6':'#4c1d95',
    },
    font: { heading:'Cormorant Garamond', body:'Raleway' },
  },
]

const GOOGLE_FONTS = [
  'Inter','Poppins','Lato','Raleway','Montserrat','DM Sans','Nunito','Josefin Sans',
]
const GOOGLE_FONTS_HEADING = [
  'Playfair Display','Cinzel','Cormorant Garamond','Libre Baskerville',
  'Montserrat','Raleway','Josefin Sans','Bebas Neue',
]

// ── Derive CSS accent variants from hex ──────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return { r, g, b }
}

// ── Apply theme to document ──────────────────────────────────────────────────
function applyTheme(vars, fontHeading, fontBody) {
  const root = document.documentElement
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))

  // Derive dim/border/glow from accent
  const accent = vars['--c-accent']
  if (accent && accent.startsWith('#')) {
    const { r, g, b } = hexToRgb(accent)
    root.style.setProperty('--c-accent-dim',    `rgba(${r},${g},${b},0.15)`)
    root.style.setProperty('--c-accent-border',  `rgba(${r},${g},${b},0.22)`)
    root.style.setProperty('--c-accent-glow',    `rgba(${r},${g},${b},0.12)`)
    root.style.setProperty('--c-tooltip-bg',     vars['--c-input'] || vars['--c-page'])
    root.style.setProperty('--c-tooltip-border', `rgba(${r},${g},${b},0.25)`)
    root.style.setProperty('--c-tooltip-text',   vars['--c-accent-light'] || `#fff`)

    // Only auto-derive text colors if NOT explicitly provided in vars
    if (!vars['--c-text'])
      root.style.setProperty('--c-text', `hsl(${Math.round(accentHue(r,g,b))},80%,93%)`)
    if (!vars['--c-text-muted'])
      root.style.setProperty('--c-text-muted', `rgba(${r},${g},${b},0.45)`)
    if (!vars['--c-text-label'])
      root.style.setProperty('--c-text-label', `rgba(${r},${g},${b},0.70)`)
  }

  // Fonts
  if (fontHeading) {
    root.style.setProperty('--font-heading', `'${fontHeading}', serif`)
    loadGoogleFont(fontHeading)
  }
  if (fontBody) {
    root.style.setProperty('--font-body', `'${fontBody}', sans-serif`)
    loadGoogleFont(fontBody)
  }
}

function accentHue(r, g, b) {
  const max = Math.max(r,g,b), min = Math.min(r,g,b)
  if (max === min) return 0
  const d = max - min
  if (max === r) return ((g-b)/d + (g<b?6:0)) * 60
  if (max === g) return ((b-r)/d + 2) * 60
  return ((r-g)/d + 4) * 60
}

function loadGoogleFont(name) {
  const id = `gf-${name.replace(/\s+/g,'-')}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${name.replace(/\s+/g,'+')}:wght@300;400;500;600;700;800&display=swap`
  document.head.appendChild(link)
}

// ── Save / load ──────────────────────────────────────────────────────────────
const STORAGE_KEY = 'app-theme-v1'

function saveTheme(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function loadSavedTheme() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null }
}

// ── Default state ────────────────────────────────────────────────────────────
const DEFAULT = {
  vars: PRESETS[0].vars,
  fontHeading: PRESETS[0].font.heading,
  fontBody: PRESETS[0].font.body,
}

export function initTheme() {
  const saved = loadSavedTheme() || DEFAULT
  applyTheme(saved.vars, saved.fontHeading, saved.fontBody)
}

// ── Panel Component ──────────────────────────────────────────────────────────
export default function ThemePanel() {
  const [open, setOpen] = useState(false)
  const saved = loadSavedTheme() || DEFAULT

  const [vars, setVars] = useState(saved.vars)
  const [fontHeading, setFontHeading] = useState(saved.fontHeading)
  const [fontBody, setFontBody] = useState(saved.fontBody)
  const [savedOk, setSavedOk] = useState(false)

  // sync immediately on any change
  useEffect(() => { applyTheme(vars, fontHeading, fontBody) }, [vars, fontHeading, fontBody])

  const setVar = (key, val) => setVars(v => ({ ...v, [key]: val }))

  const applyPreset = (p) => {
    setVars(p.vars)
    setFontHeading(p.font.heading)
    setFontBody(p.font.body)
  }

  const handleSave = () => {
    saveTheme({ vars, fontHeading, fontBody })
    setSavedOk(true)
    setTimeout(() => setSavedOk(false), 2000)
  }

  const handleReset = () => {
    applyPreset(PRESETS[0])
    saveTheme({ vars: PRESETS[0].vars, fontHeading: PRESETS[0].font.heading, fontBody: PRESETS[0].font.body })
  }

  const colorFields = [
    { key: '--c-page',         label: 'Latar Halaman' },
    { key: '--c-card',         label: 'Latar Kartu' },
    { key: '--c-input',        label: 'Latar Input' },
    { key: '--c-accent',       label: 'Warna Aksen' },
    { key: '--c-accent-light', label: 'Aksen Terang' },
  ]

  const textColorFields = [
    { key: '--c-text',       label: 'Teks Utama' },
    { key: '--c-text-muted', label: 'Teks Redup' },
    { key: '--c-text-label', label: 'Label / Keterangan' },
  ]

  // parse any css color value to a safe #hex for <input type="color">
  const toHex = (val) => {
    if (!val) return '#888888'
    if (val.startsWith('#') && (val.length === 4 || val.length === 7)) return val
    const m = val.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (m) return '#' + [m[1],m[2],m[3]].map(n => parseInt(n).toString(16).padStart(2,'0')).join('')
    return '#888888'
  }

  const pieFields = [
    { key: '--c-pie-1', label: 'Pie 1' },
    { key: '--c-pie-2', label: 'Pie 2' },
    { key: '--c-pie-3', label: 'Pie 3' },
    { key: '--c-pie-4', label: 'Pie 4' },
    { key: '--c-pie-5', label: 'Pie 5' },
    { key: '--c-pie-6', label: 'Pie 6' },
  ]

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Theme Control"
        className="fixed bottom-6 right-6 z-[9999] w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110"
        style={{ background:'var(--c-accent)', boxShadow:`0 0 20px var(--c-accent-glow, rgba(245,158,11,0.4))` }}
      >
        <span className="text-xl">{open ? '✕' : '🎨'}</span>
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-20 right-6 z-[9998] w-80 max-h-[82vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col"
          style={{ background:'var(--c-card)', border:'1px solid var(--c-accent-border)', boxShadow:`0 8px 40px var(--c-accent-glow, rgba(0,0,0,0.5))` }}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b" style={{ borderColor:'var(--c-accent-border)' }}>
            <h2 className="font-bold text-base" style={{ color:'var(--c-accent)', fontFamily:'var(--font-heading)' }}>
              🎨 Theme Control
            </h2>
            <p className="text-xs mt-0.5" style={{ color:'var(--c-text-muted)' }}>Ubah warna & font secara langsung</p>
          </div>

          <div className="px-5 py-4 space-y-5">

            {/* Presets */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color:'var(--c-text-label)' }}>Preset Tema</p>
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map(p => (
                  <button
                    key={p.name}
                    onClick={() => applyPreset(p)}
                    className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-xs font-semibold transition hover:scale-105 active:scale-95"
                    style={{
                      background: `${p.vars['--c-accent']}22`,
                      border: `1px solid ${p.vars['--c-accent']}55`,
                      color: p.vars['--c-accent'],
                    }}
                  >
                    <span className="text-base">{p.emoji}</span>
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height:1, background:'var(--c-accent-border)' }} />

            {/* ── BG & Accent Colors ── */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color:'var(--c-text-label)' }}>Warna Latar & Aksen</p>
              <div className="space-y-2">
                {colorFields.map(f => (
                  <ColorRow key={f.key} label={f.label} value={vars[f.key] || '#000000'} hex={toHex(vars[f.key])}
                    onChange={val => setVar(f.key, val)} />
                ))}
              </div>
            </div>

            {/* divider */}
            <div style={{ height:1, background:'var(--c-accent-border)' }} />

            {/* ── Text / Font Colors ── */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color:'var(--c-text-label)' }}>Warna Font / Teks</p>
              <div className="space-y-2">
                {textColorFields.map(f => (
                  <ColorRow key={f.key} label={f.label} value={vars[f.key] || '#cccccc'} hex={toHex(vars[f.key])}
                    onChange={val => setVar(f.key, val)} />
                ))}
              </div>
              <p className="text-[10px] mt-2" style={{ color:'var(--c-text-muted)' }}>* Pilih preset untuk reset otomatis warna teks.</p>
            </div>

            {/* divider */}
            <div style={{ height:1, background:'var(--c-accent-border)' }} />

            {/* ── Pie Chart Colors ── */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color:'var(--c-text-label)' }}>Warna Chart (Pie)</p>
              <div className="grid grid-cols-6 gap-1.5">
                {pieFields.map(f => (
                  <div key={f.key} className="flex flex-col items-center gap-1">
                    <input
                      type="color"
                      value={toHex(vars[f.key])}
                      onChange={e => setVar(f.key, e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0.5"
                      style={{ background:'var(--c-input)', border:'1px solid var(--c-accent-border)' }}
                      title={f.label}
                    />
                    <span className="text-[10px]" style={{ color:'var(--c-text-muted)' }}>{f.label.replace('Pie ','')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* divider */}
            <div style={{ height:1, background:'var(--c-accent-border)' }} />

            {/* Fonts */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color:'var(--c-text-label)' }}>Font</p>
              <div className="space-y-2">
                <div>
                  <label className="text-xs block mb-1" style={{ color:'var(--c-text-muted)' }}>Judul / Heading</label>
                  <select
                    value={fontHeading}
                    onChange={e => setFontHeading(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl"
                    style={{ background:'var(--c-input)', border:'1px solid var(--c-accent-border)', color:'var(--c-text)' }}
                  >
                    {GOOGLE_FONTS_HEADING.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color:'var(--c-text-muted)' }}>Teks / Body</label>
                  <select
                    value={fontBody}
                    onChange={e => setFontBody(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl"
                    style={{ background:'var(--c-input)', border:'1px solid var(--c-accent-border)', color:'var(--c-text)' }}
                  >
                    {GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t flex gap-2" style={{ borderColor:'var(--c-accent-border)' }}>
            <button
              onClick={handleReset}
              className="flex-1 py-2 text-xs font-bold rounded-xl transition"
              style={{ border:'1px solid var(--c-accent-border)', color:'var(--c-text-muted)' }}
            >Reset</button>
            <button
              onClick={handleSave}
              className="flex-1 py-2 text-xs font-bold rounded-xl transition"
              style={{ background:'var(--c-accent)', color:'#000' }}
            >{savedOk ? '✓ Tersimpan!' : 'Simpan'}</button>
          </div>
        </div>
      )}
    </>
  )
}
// ── Reusable color row ────────────────────────────────────────────────────────
function ColorRow({ label, value, hex, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-xs flex-1" style={{ color:'var(--c-text-muted)' }}>{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hex}
          onChange={e => onChange(e.target.value)}
          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0.5 shrink-0"
          style={{ background:'var(--c-input)', border:'1px solid var(--c-accent-border)' }}
        />
        <input
          type="text"
          value={value}
          onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) onChange(e.target.value) }}
          className="w-24 px-2 py-1 text-xs rounded-lg font-mono"
          style={{ background:'var(--c-input)', border:'1px solid var(--c-accent-border)', color:'var(--c-text)' }}
        />
      </div>
    </div>
  )
}