'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const TYPED_QUERIES = [
  'who controls my data?',
  'what is zero-knowledge encryption',
  'how to disappear online',
  'best anonymous browsers',
  'tor network explained',
  'vpn vs proxy vs tor',
  'digital privacy rights india',
]

const PRIVACY_STATS = [
  { value: '0', label: 'Cookies stored', icon: '🍪' },
  { value: '0', label: 'Trackers active', icon: '👁' },
  { value: '0', label: 'IP logs kept', icon: '🔌' },
  { value: '∞', label: 'Searches protected', icon: '🛡' },
]

const FEATURES = [
  { icon: '🔐', title: 'Zero Logs', desc: 'No search history. No user profiles. Nothing stored ever.' },
  { icon: '🌐', title: 'Encrypted Transit', desc: 'All queries encrypted in transit. ISPs see nothing.' },
  { icon: '🚫', title: 'No Fingerprinting', desc: 'Browser fingerprinting blocked at the protocol level.' },
  { icon: '⚡', title: 'Real Results', desc: 'Powered by Google via anonymous proxy. Full results, zero tracking.' },
]

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [typedText, setTypedText] = useState('')
  const [queryIndex, setQueryIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [loaded, setLoaded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()

  useEffect(() => { setLoaded(true) }, [])

  // Typewriter effect
  useEffect(() => {
    if (isFocused) return
    const current = TYPED_QUERIES[queryIndex]
    const speed = isDeleting ? 40 : 80
    const timer = setTimeout(() => {
      if (!isDeleting && charIndex < current.length) {
        setTypedText(current.slice(0, charIndex + 1))
        setCharIndex(c => c + 1)
      } else if (isDeleting && charIndex > 0) {
        setTypedText(current.slice(0, charIndex - 1))
        setCharIndex(c => c - 1)
      } else if (!isDeleting && charIndex === current.length) {
        setTimeout(() => setIsDeleting(true), 1800)
      } else if (isDeleting && charIndex === 0) {
        setIsDeleting(false)
        setQueryIndex(i => (i + 1) % TYPED_QUERIES.length)
      }
    }, speed)
    return () => clearTimeout(timer)
  }, [charIndex, isDeleting, queryIndex, isFocused])

  // Particle canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let particles: Array<{ x: number; y: number; vx: number; vy: number; size: number; opacity: number; hue: number }> = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.6 + 0.1,
        hue: Math.random() * 60 + 240, // purple-violet range
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `hsla(260, 70%, 65%, ${(1 - dist / 120) * 0.25})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      // Draw particles
      particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.opacity})`
        ctx.fill()

        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
      })

      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  // Mouse parallax
  useEffect(() => {
    const handler = (e: MouseEvent) => setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  const handleSearch = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()
    const q = query.trim()
    if (!q) return
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }, [query, router])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: 'var(--void)' }}>
      {/* Particle canvas */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      {/* Animated grid floor */}
      <div style={{
        position: 'fixed', bottom: 0, left: '-50%', right: '-50%', height: '50vh',
        backgroundImage: `linear-gradient(var(--purple-dim) 1px, transparent 1px), linear-gradient(90deg, var(--purple-dim) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        transform: `perspective(600px) rotateX(70deg) translateY(${mousePos.y * 10}px)`,
        opacity: 0.15, zIndex: 0,
        animation: 'grid-move 4s linear infinite',
      }} />

      {/* Radial glow blobs */}
      <div style={{
        position: 'fixed', top: '20%', left: '15%', width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(124,92,191,0.18) 0%, transparent 70%)',
        transform: `translate(${(mousePos.x - 0.5) * -30}px, ${(mousePos.y - 0.5) * -30}px)`,
        zIndex: 0, pointerEvents: 'none', transition: 'transform 0.1s ease',
      }} />
      <div style={{
        position: 'fixed', top: '30%', right: '10%', width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(224,64,251,0.10) 0%, transparent 70%)',
        transform: `translate(${(mousePos.x - 0.5) * 20}px, ${(mousePos.y - 0.5) * 20}px)`,
        zIndex: 0, pointerEvents: 'none', transition: 'transform 0.12s ease',
      }} />
      <div style={{
        position: 'fixed', bottom: '20%', left: '40%', width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(0,229,255,0.07) 0%, transparent 70%)',
        zIndex: 0, pointerEvents: 'none',
      }} />

      {/* Scanline overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
      }} />

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(124,92,191,0.15)',
        backdropFilter: 'blur(20px)', background: 'rgba(4,2,13,0.7)',
        opacity: loaded ? 1 : 0, transition: 'opacity 0.6s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', width: 36, height: 36 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--purple-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(124,92,191,0.15)' }}>
              <span style={{ fontSize: 18 }}>👁</span>
            </div>
            <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '1px solid rgba(124,92,191,0.3)', animation: 'pulse-ring 3s ease-out infinite' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'Orbitron, monospace', fontWeight: 800, fontSize: 16, letterSpacing: '0.15em', color: 'var(--violet)', lineHeight: 1 }}>PHANTOM</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--purple-core)', letterSpacing: '0.3em', marginTop: 2 }}>SEARCH ENGINE</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {[
            { dot: '#00e676', label: 'No Cookies' },
            { dot: '#00e5ff', label: 'Encrypted' },
            { dot: '#e040fb', label: 'Anonymous' },
          ].map(({ dot, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)', fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: dot, boxShadow: `0 0 8px ${dot}` }} />
              {label}
            </div>
          ))}
        </div>
      </nav>

      {/* HERO */}
      <main style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '120px 24px 80px' }}>

        {/* Shield orb */}
        <div className="animate-float" style={{ marginBottom: 40, position: 'relative', opacity: loaded ? 1 : 0, transition: 'opacity 0.8s ease 0.2s' }}>
          {/* Orbiting rings */}
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              position: 'absolute',
              top: '50%', left: '50%',
              width: 120 + i * 50, height: 120 + i * 50,
              marginLeft: -(60 + i * 25), marginTop: -(60 + i * 25),
              borderRadius: '50%',
              border: `1px solid rgba(124,92,191,${0.3 - i * 0.08})`,
              animation: `orbit ${8 + i * 4}s linear infinite${i % 2 === 0 ? ' reverse' : ''}`,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: i === 1 ? 'var(--cyan)' : i === 2 ? 'var(--purple-bright)' : 'var(--accent)', boxShadow: `0 0 10px currentColor`, marginTop: -3, marginLeft: '50%' }} />
            </div>
          ))}
          {/* Core orb */}
          <div style={{
            width: 110, height: 110, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, rgba(157,125,232,0.4), rgba(124,92,191,0.2), rgba(26,21,64,0.8))',
            border: '2px solid rgba(157,125,232,0.5)',
            boxShadow: '0 0 40px rgba(124,92,191,0.4), inset 0 0 30px rgba(157,125,232,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44,
            backdropFilter: 'blur(10px)',
          }}>
            🛡
          </div>
        </div>

        {/* Headline */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.4em', color: 'var(--purple-core)', marginBottom: 16, textTransform: 'uppercase', opacity: loaded ? 1 : 0, transition: 'opacity 0.6s ease 0.3s' }}>
            ◈ PRIVATE · SECURE · UNTRACEABLE ◈
          </div>
          <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: 'clamp(36px, 7vw, 72px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 20, opacity: loaded ? 1 : 0, transition: 'opacity 0.8s ease 0.4s' }}>
            <span style={{ background: 'linear-gradient(135deg, #ddd0ff 0%, #9d7de8 40%, #e040fb 70%, #c4a8ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Search Without
            </span>
            <br />
            <span style={{ color: 'var(--text-primary)' }}>Being Watched.</span>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto', lineHeight: 1.7, opacity: loaded ? 1 : 0, transition: 'opacity 0.8s ease 0.5s' }}>
            No cookies. No tracking. No surveillance. Just pure, anonymous search powered by encrypted technology.
          </p>
        </div>

        {/* SEARCH BAR */}
        <div style={{ width: '100%', maxWidth: 680, marginBottom: 60, opacity: loaded ? 1 : 0, transition: 'opacity 0.8s ease 0.6s' }}>
          <div style={{
            position: 'relative',
            background: 'rgba(18,15,46,0.8)',
            borderRadius: 16,
            border: isFocused ? '1px solid rgba(157,125,232,0.8)' : '1px solid rgba(74,63,160,0.4)',
            boxShadow: isFocused
              ? '0 0 0 4px rgba(124,92,191,0.15), 0 20px 60px rgba(0,0,0,0.5), 0 0 60px rgba(124,92,191,0.1)'
              : '0 20px 60px rgba(0,0,0,0.4)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            backdropFilter: 'blur(20px)',
          }}>
            {/* Glow bar on focus */}
            {isFocused && <div style={{ position: 'absolute', top: -1, left: '20%', right: '20%', height: 2, background: 'linear-gradient(90deg, transparent, var(--purple-bright), var(--accent), var(--purple-bright), transparent)', borderRadius: '0 0 4px 4px', opacity: 0.8 }} />}

            <div style={{ display: 'flex', alignItems: 'center', padding: '6px 8px 6px 20px', gap: 12 }}>
              {/* Search icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isFocused ? '#9d7de8' : '#4a3fa0'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'stroke 0.3s' }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>

              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  style={{
                    width: '100%', background: 'transparent', border: 'none', outline: 'none',
                    fontSize: 18, color: 'var(--text-primary)', padding: '12px 0',
                    letterSpacing: '0.01em',
                  }}
                  autoComplete="off"
                  spellCheck={false}
                />
                {/* Placeholder typewriter */}
                {!query && !isFocused && (
                  <div style={{
                    position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)',
                    color: 'var(--text-muted)', fontSize: 18, pointerEvents: 'none',
                    display: 'flex', alignItems: 'center', gap: 0, letterSpacing: '0.01em',
                  }}>
                    <span>{typedText}</span>
                    <span style={{ width: 2, height: 20, background: 'var(--purple-bright)', marginLeft: 1, animation: 'blink 1s step-end infinite', borderRadius: 1 }} />
                  </div>
                )}
              </div>

              {/* Lock badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'rgba(0,230,118,0.08)', borderRadius: 8, border: '1px solid rgba(0,230,118,0.15)', flexShrink: 0 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00e676" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#00e676', letterSpacing: '0.05em' }}>PRIVATE</span>
              </div>

              {/* Search button */}
              <button
                onClick={() => handleSearch()}
                style={{
                  padding: '12px 24px', borderRadius: 10, border: 'none',
                  background: query ? 'linear-gradient(135deg, #7c5cbf, #9d7de8, #e040fb)' : 'rgba(74,63,160,0.3)',
                  color: query ? 'white' : 'var(--text-muted)',
                  fontWeight: 700, fontSize: 15, letterSpacing: '0.05em',
                  transition: 'all 0.2s ease', cursor: query ? 'pointer' : 'default',
                  boxShadow: query ? '0 4px 20px rgba(157,125,232,0.4)' : 'none',
                  fontFamily: 'Orbitron, monospace',
                }}>
                SEARCH
              </button>
            </div>
          </div>

          {/* Quick searches */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['Privacy tools', 'Tor browser', 'VPN guide', 'Encrypted email'].map(s => (
              <button key={s} onClick={() => { setQuery(s); router.push(`/search?q=${encodeURIComponent(s)}`) }} style={{
                padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(74,63,160,0.3)',
                background: 'rgba(18,15,46,0.5)', color: 'var(--text-secondary)', fontSize: 12,
                cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(10px)',
                fontFamily: 'JetBrains Mono, monospace',
              }}
                onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'rgba(157,125,232,0.6)'; (e.target as HTMLElement).style.color = 'var(--violet)' }}
                onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'rgba(74,63,160,0.3)'; (e.target as HTMLElement).style.color = 'var(--text-secondary)' }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Privacy Stats */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 80, flexWrap: 'wrap', justifyContent: 'center', opacity: loaded ? 1 : 0, transition: 'opacity 0.8s ease 0.7s' }}>
          {PRIVACY_STATS.map(({ value, label, icon }) => (
            <div key={label} style={{
              textAlign: 'center', padding: '20px 28px',
              background: 'rgba(18,15,46,0.6)', borderRadius: 16,
              border: '1px solid rgba(74,63,160,0.25)', backdropFilter: 'blur(20px)',
              minWidth: 120,
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 28, fontWeight: 900, color: value === '0' ? '#00e676' : 'var(--purple-glow)', lineHeight: 1, marginBottom: 6, textShadow: value === '0' ? '0 0 20px rgba(0,230,118,0.5)' : '0 0 20px rgba(184,158,245,0.5)' }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.05em', fontFamily: 'JetBrains Mono, monospace' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Features grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, maxWidth: 900, width: '100%', opacity: loaded ? 1 : 0, transition: 'opacity 0.8s ease 0.8s' }}>
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title} style={{
              padding: '24px', borderRadius: 16,
              background: 'rgba(18,15,46,0.5)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(74,63,160,0.2)',
              transition: 'all 0.3s ease', cursor: 'default',
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'rgba(124,92,191,0.5)'
                el.style.background = 'rgba(26,21,64,0.7)'
                el.style.transform = 'translateY(-4px)'
                el.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3), 0 0 30px rgba(124,92,191,0.1)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'rgba(74,63,160,0.2)'
                el.style.background = 'rgba(18,15,46,0.5)'
                el.style.transform = 'translateY(0)'
                el.style.boxShadow = 'none'
              }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
              <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 13, fontWeight: 700, color: 'var(--violet)', letterSpacing: '0.05em', marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* Tech architecture SVG animation */}
        <div style={{ marginTop: 80, width: '100%', maxWidth: 800, opacity: loaded ? 1 : 0, transition: 'opacity 1s ease 1s' }}>
          <div style={{ textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.3em', color: 'var(--text-dim)', marginBottom: 24, textTransform: 'uppercase' }}>
            How your search travels — encrypted end to end
          </div>
          <svg viewBox="0 0 800 140" style={{ width: '100%', overflow: 'visible' }}>
            <defs>
              <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M1 1L8 5L1 9" fill="none" stroke="#7c5cbf" strokeWidth="2" strokeLinecap="round"/>
              </marker>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {/* Nodes */}
            {[
              { x: 80, label: 'YOU', sub: 'Encrypted', color: '#00e5ff', icon: '👤' },
              { x: 240, label: 'PHANTOM', sub: 'Proxy Layer', color: '#9d7de8', icon: '👁' },
              { x: 400, label: 'RELAY', sub: 'Anonymize', color: '#e040fb', icon: '🔀' },
              { x: 560, label: 'INDEX', sub: 'Search Index', color: '#9d7de8', icon: '🗄' },
              { x: 720, label: 'RESULTS', sub: 'To You Only', color: '#00e676', icon: '✅' },
            ].map(({ x, label, sub, color, icon }) => (
              <g key={label}>
                <circle cx={x} cy={70} r={34} fill="rgba(18,15,46,0.9)" stroke={color} strokeWidth="1.5" filter="url(#glow)" opacity="0.9"/>
                <text x={x} y={65} textAnchor="middle" fontSize="20" dominantBaseline="middle">{icon}</text>
                <text x={x} y={84} textAnchor="middle" fill={color} fontSize="8" fontFamily="Orbitron, monospace" fontWeight="700" letterSpacing="0.1em">{label}</text>
                <text x={x} y={115} textAnchor="middle" fill="#6b5e8a" fontSize="9" fontFamily="JetBrains Mono, monospace">{sub}</text>
              </g>
            ))}

            {/* Animated connection lines */}
            {[[80+34, 240-34], [240+34, 400-34], [400+34, 560-34], [560+34, 720-34]].map(([x1, x2], i) => (
              <g key={i}>
                <line x1={x1} y1={70} x2={x2} y2={70} stroke="rgba(74,63,160,0.3)" strokeWidth="1" strokeDasharray="4 4"/>
                <line x1={x1} y1={70} x2={x2} y2={70} stroke="#7c5cbf" strokeWidth="1.5" strokeDasharray="8 20" markerEnd="url(#arr)"
                  style={{ animation: `dash-anim ${1.5 + i * 0.3}s linear infinite`, strokeDashoffset: 0 }}/>
              </g>
            ))}

            {/* Lock badges on lines */}
            {[160, 320, 480, 640].map(x => (
              <g key={x}>
                <rect x={x - 16} y={54} width={32} height={16} rx={8} fill="rgba(0,230,118,0.1)" stroke="rgba(0,230,118,0.3)" strokeWidth="0.5"/>
                <text x={x} y={63} textAnchor="middle" fill="#00e676" fontSize="8" fontFamily="JetBrains Mono, monospace" dominantBaseline="middle">🔒</text>
              </g>
            ))}
          </svg>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        position: 'relative', zIndex: 10, textAlign: 'center', padding: '24px',
        borderTop: '1px solid rgba(74,63,160,0.15)', background: 'rgba(4,2,13,0.6)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
          PHANTOM SEARCH · NO LOGS · NO COOKIES · NO COMPROMISE
        </div>
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-dim)', opacity: 0.6 }}>
          Powered by anonymous search technology · {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  )
}
