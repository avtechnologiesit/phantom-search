'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const TYPED_QUERIES = [
  'who controls my data?',
  'what is zero-knowledge encryption',
  'how to disappear online',
  'best anonymous browsers 2024',
  'vpn vs tor vs proxy',
  'digital privacy rights india',
  'end-to-end encryption explained',
]

const STATS = [
  { value: '0', label: 'Cookies stored', glow: '#00e676' },
  { value: '0', label: 'Trackers active', glow: '#00e676' },
  { value: '0', label: 'IP logs kept', glow: '#00e676' },
  { value: '∞', label: 'Searches protected', glow: '#9d7de8' },
]

const FEATURES = [
  { icon: '🔐', title: 'Zero Logs', desc: 'No search history. No user profiles. Nothing stored.' },
  { icon: '🌐', title: 'Encrypted', desc: 'All queries encrypted. ISPs see nothing.' },
  { icon: '🚫', title: 'No Fingerprinting', desc: 'Browser fingerprinting blocked at protocol level.' },
  { icon: '⚡', title: 'Real Results', desc: 'Full Google results via anonymous proxy.' },
]

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [typedText, setTypedText] = useState('')
  const [qIdx, setQIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const [focused, setFocused] = useState(false)
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 })
  const [loaded, setLoaded] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => { setTimeout(() => setLoaded(true), 80) }, [])

  // Typewriter
  useEffect(() => {
    if (focused) return
    const cur = TYPED_QUERIES[qIdx]
    const t = setTimeout(() => {
      if (!deleting && charIdx < cur.length) { setTypedText(cur.slice(0, charIdx + 1)); setCharIdx(c => c + 1) }
      else if (deleting && charIdx > 0) { setTypedText(cur.slice(0, charIdx - 1)); setCharIdx(c => c - 1) }
      else if (!deleting && charIdx === cur.length) { setTimeout(() => setDeleting(true), 1800) }
      else { setDeleting(false); setQIdx(i => (i + 1) % TYPED_QUERIES.length) }
    }, deleting ? 38 : 75)
    return () => clearTimeout(t)
  }, [charIdx, deleting, qIdx, focused])

  // Particle canvas
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    let id: number
    const pts = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
      r: Math.random() * 1.8 + .4, o: Math.random() * .5 + .1,
      h: Math.random() * 60 + 240,
    }))
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize(); window.addEventListener('resize', resize)
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.hypot(dx, dy)
          if (d < 110) { ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.strokeStyle = `hsla(260,70%,65%,${(1 - d / 110) * .2})`; ctx.lineWidth = .4; ctx.stroke() }
        }
        ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, pts[i].r, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${pts[i].h},80%,70%,${pts[i].o})`; ctx.fill()
        pts[i].x += pts[i].vx; pts[i].y += pts[i].vy
        if (pts[i].x < 0 || pts[i].x > canvas.width) pts[i].vx *= -1
        if (pts[i].y < 0 || pts[i].y > canvas.height) pts[i].vy *= -1
      }
      id = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', resize) }
  }, [])

  // Mouse parallax
  useEffect(() => {
    const h = (e: MouseEvent) => setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [])

  const search = useCallback(() => {
    const q = query.trim(); if (!q) return
    router.push(`/search?q=${encodeURIComponent(q)}&tab=web`)
  }, [query, router])

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: 'var(--void)' }}>
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      {/* Grid floor */}
      <div style={{ position: 'fixed', bottom: 0, left: '-50%', right: '-50%', height: '45vh', backgroundImage: 'linear-gradient(var(--purple-dim) 1px,transparent 1px),linear-gradient(90deg,var(--purple-dim) 1px,transparent 1px)', backgroundSize: '50px 50px', transform: `perspective(500px) rotateX(65deg) translateY(${mouse.y * 8}px)`, opacity: .12, zIndex: 0, animation: 'grid-move 5s linear infinite' }} />

      {/* Glow blobs */}
      <div style={{ position: 'fixed', top: '15%', left: '10%', width: 500, height: 500, background: 'radial-gradient(circle,rgba(124,92,191,.16) 0%,transparent 70%)', transform: `translate(${(mouse.x-.5)*-25}px,${(mouse.y-.5)*-25}px)`, zIndex: 0, pointerEvents: 'none', transition: 'transform .12s ease' }} />
      <div style={{ position: 'fixed', top: '30%', right: '8%', width: 400, height: 400, background: 'radial-gradient(circle,rgba(224,64,251,.08) 0%,transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

      {/* Scanline */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.025) 2px,rgba(0,0,0,.025) 4px)' }} />

      {/* ── NAV ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(124,92,191,.12)', backdropFilter: 'blur(20px)', background: 'rgba(4,2,13,.72)', opacity: loaded ? 1 : 0, transition: 'opacity .5s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', width: 32, height: 32 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid var(--purple-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(124,92,191,.15)', fontSize: 16 }}>👁</div>
            <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '1px solid rgba(124,92,191,.25)', animation: 'pulse-ring 3s ease-out infinite' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'Orbitron,monospace', fontWeight: 800, fontSize: 14, letterSpacing: '.14em', color: 'var(--violet)', lineHeight: 1 }}>PHANTOM</div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: 'var(--purple-core)', letterSpacing: '.28em' }}>SEARCH ENGINE</div>
          </div>
        </div>
        {/* Nav badges — hidden on very small screens */}
        <div className="hide-mobile" style={{ display: 'flex', gap: 6 }}>
          {[['#00e676','No Cookies'],['#00e5ff','Encrypted'],['#e040fb','Anonymous']].map(([c,l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 16, border: '1px solid rgba(255,255,255,.05)', background: 'rgba(255,255,255,.02)', fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono,monospace' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: c, boxShadow: `0 0 6px ${c}` }} />{l}
            </div>
          ))}
        </div>
      </nav>

      {/* ── HERO ── */}
      <main style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '100px 16px 60px', textAlign: 'center' }}>

        {/* Shield orb */}
        <div className="animate-float" style={{ marginBottom: 32, position: 'relative', opacity: loaded ? 1 : 0, transition: 'opacity .7s ease .2s' }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ position: 'absolute', top: '50%', left: '50%', width: 100+i*44, height: 100+i*44, marginLeft: -(50+i*22), marginTop: -(50+i*22), borderRadius: '50%', border: `1px solid rgba(124,92,191,${.28-i*.07})`, animation: `orbit ${8+i*4}s linear infinite${i%2===0?' reverse':''}` }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: i===1?'var(--cyan)':i===2?'var(--purple-bright)':'var(--accent)', marginTop: -2.5, marginLeft: '50%' }} />
            </div>
          ))}
          <div style={{ width: 94, height: 94, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%,rgba(157,125,232,.4),rgba(124,92,191,.2),rgba(26,21,64,.8))', border: '1.5px solid rgba(157,125,232,.45)', boxShadow: '0 0 36px rgba(124,92,191,.35),inset 0 0 24px rgba(157,125,232,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38 }}>🛡</div>
        </div>

        {/* Headline */}
        <div style={{ marginBottom: 36, opacity: loaded ? 1 : 0, transition: 'opacity .8s ease .3s' }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, letterSpacing: '.35em', color: 'var(--purple-core)', marginBottom: 14, textTransform: 'uppercase' }}>◈ PRIVATE · SECURE · UNTRACEABLE ◈</div>
          <h1 style={{ fontFamily: 'Orbitron,monospace', fontSize: 'clamp(28px,6.5vw,66px)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-.02em', marginBottom: 16 }}>
            <span style={{ background: 'linear-gradient(135deg,#ddd0ff 0%,#9d7de8 40%,#e040fb 70%,#c4a8ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Search Without</span>
            <br /><span style={{ color: 'var(--text-primary)' }}>Being Watched.</span>
          </h1>
          <p style={{ fontSize: 'clamp(13px,2vw,16px)', color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto', lineHeight: 1.7 }}>
            No cookies. No tracking. No surveillance. Pure anonymous search.
          </p>
        </div>

        {/* ── SEARCH BAR ── */}
        <div style={{ width: '100%', maxWidth: 660, marginBottom: 40, opacity: loaded ? 1 : 0, transition: 'opacity .8s ease .5s' }}>
          <div style={{ position: 'relative', background: 'rgba(18,15,46,.82)', borderRadius: 16, border: focused ? '1px solid rgba(157,125,232,.8)' : '1px solid rgba(74,63,160,.4)', boxShadow: focused ? '0 0 0 4px rgba(124,92,191,.14),0 16px 50px rgba(0,0,0,.5)' : '0 16px 50px rgba(0,0,0,.4)', transition: 'all .25s ease', backdropFilter: 'blur(20px)' }}>
            {focused && <div style={{ position: 'absolute', top: -1, left: '15%', right: '15%', height: 2, background: 'linear-gradient(90deg,transparent,var(--purple-bright),var(--accent),var(--purple-bright),transparent)', borderRadius: '0 0 4px 4px', opacity: .8 }} />}

            <div style={{ display: 'flex', alignItems: 'center', padding: '6px 8px 6px 18px', gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={focused?'#9d7de8':'#4a3fa0'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'stroke .2s' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>

              <div style={{ position: 'relative', flex: 1 }}>
                <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && search()}
                  onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                  style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 'clamp(15px,3vw,18px)', color: 'var(--text-primary)', padding: '12px 0', letterSpacing: '.01em' }}
                  autoComplete="off" spellCheck={false} />
                {!query && !focused && (
                  <div style={{ position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 'clamp(14px,2.5vw,18px)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                    <span>{typedText}</span>
                    <span style={{ width: 2, height: 18, background: 'var(--purple-bright)', marginLeft: 1, animation: 'blink 1s step-end infinite', borderRadius: 1 }} />
                  </div>
                )}
              </div>

              {/* Private badge — hidden on tiny screens */}
              <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 8px', background: 'rgba(0,230,118,.08)', borderRadius: 7, border: '1px solid rgba(0,230,118,.14)', flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00e676" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#00e676' }}>PRIVATE</span>
              </div>

              <button onClick={search} style={{ padding: '11px 20px', borderRadius: 10, border: 'none', background: query ? 'linear-gradient(135deg,#7c5cbf,#9d7de8,#e040fb)' : 'rgba(74,63,160,.3)', color: query ? 'white' : 'var(--text-muted)', fontWeight: 700, fontSize: 'clamp(12px,2vw,15px)', transition: 'all .2s ease', cursor: query ? 'pointer' : 'default', boxShadow: query ? '0 4px 18px rgba(157,125,232,.4)' : 'none', fontFamily: 'Orbitron,monospace', letterSpacing: '.04em', whiteSpace: 'nowrap' }}>
                SEARCH
              </button>
            </div>
          </div>

          {/* Quick searches */}
          <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['Privacy tools','Tor browser','VPN guide','Encrypted email'].map(s => (
              <button key={s} onClick={() => { setQuery(s); router.push(`/search?q=${encodeURIComponent(s)}&tab=web`) }}
                style={{ padding: '5px 12px', borderRadius: 16, border: '1px solid rgba(74,63,160,.28)', background: 'rgba(18,15,46,.5)', color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer', transition: 'all .18s', fontFamily: 'JetBrains Mono,monospace', backdropFilter: 'blur(10px)' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.borderColor='rgba(157,125,232,.5)'; (e.target as HTMLElement).style.color='var(--violet)' }}
                onMouseLeave={e => { (e.target as HTMLElement).style.borderColor='rgba(74,63,160,.28)'; (e.target as HTMLElement).style.color='var(--text-secondary)' }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))', gap: 10, width: '100%', maxWidth: 560, marginBottom: 56, opacity: loaded ? 1 : 0, transition: 'opacity .8s ease .6s' }}>
          {STATS.map(({ value, label, glow }) => (
            <div key={label} style={{ textAlign: 'center', padding: '16px 12px', background: 'rgba(18,15,46,.6)', borderRadius: 14, border: '1px solid rgba(74,63,160,.22)', backdropFilter: 'blur(16px)' }}>
              <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 'clamp(20px,4vw,26px)', fontWeight: 900, color: glow, lineHeight: 1, marginBottom: 6, textShadow: `0 0 16px ${glow}66` }}>{value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '.04em', fontFamily: 'JetBrains Mono,monospace' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, maxWidth: 860, width: '100%', opacity: loaded ? 1 : 0, transition: 'opacity .8s ease .7s' }}>
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title} style={{ padding: '22px 20px', borderRadius: 16, background: 'rgba(18,15,46,.5)', backdropFilter: 'blur(18px)', border: '1px solid rgba(74,63,160,.18)', transition: 'all .28s ease' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor='rgba(124,92,191,.45)'; el.style.background='rgba(26,21,64,.7)'; el.style.transform='translateY(-3px)'; el.style.boxShadow='0 16px 32px rgba(0,0,0,.28)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor='rgba(74,63,160,.18)'; el.style.background='rgba(18,15,46,.5)'; el.style.transform='none'; el.style.boxShadow='none' }}>
              <div style={{ fontSize: 26, marginBottom: 10 }}>{icon}</div>
              <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 12, fontWeight: 700, color: 'var(--violet)', letterSpacing: '.04em', marginBottom: 7 }}>{title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '18px 16px', borderTop: '1px solid rgba(74,63,160,.12)', background: 'rgba(4,2,13,.65)', backdropFilter: 'blur(20px)' }}>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '.08em' }}>PHANTOM SEARCH · NO LOGS · NO COOKIES · NO COMPROMISE · {new Date().getFullYear()}</div>
      </footer>
    </div>
  )
}
