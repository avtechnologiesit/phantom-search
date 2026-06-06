'use client'
import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface SearchResult {
  title: string
  url: string
  description: string
  favicon: string
  domain: string
  position: number
  isAbstract?: boolean
}

interface SearchResponse {
  results: SearchResult[]
  total: number
  searchTime: string
  query: string
  page: number
  note?: string
}

function SearchPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1')

  const [query, setQuery] = useState(q)
  const [data, setData] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [progressWidth, setProgressWidth] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const doSearch = useCallback(async (searchQ: string, searchPage: number) => {
    if (!searchQ.trim()) return
    setLoading(true)
    setError('')
    setData(null)
    setProgressWidth(0)

    // Animate progress bar
    const prog = setInterval(() => setProgressWidth(w => Math.min(w + Math.random() * 15, 85)), 120)

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQ)}&page=${searchPage}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Search failed')
      setData(json)
      setProgressWidth(100)
      setTimeout(() => setProgressWidth(0), 500)
    } catch (e: any) {
      setError(e.message)
      setProgressWidth(0)
    } finally {
      clearInterval(prog)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (q) { setQuery(q); doSearch(q, page) }
  }, [q, page, doSearch])

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim()) return
    router.push(`/search?q=${encodeURIComponent(query)}&page=1`)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--void)', color: 'var(--text-primary)' }}>
      {/* Progress bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, height: 2, zIndex: 100,
        width: `${progressWidth}%`,
        background: 'linear-gradient(90deg, #7c5cbf, #e040fb, #00e5ff)',
        transition: progressWidth === 100 ? 'width 0.3s ease, opacity 0.5s ease 0.3s' : 'width 0.12s ease',
        opacity: progressWidth === 0 ? 0 : 1,
        boxShadow: '0 0 10px rgba(157,125,232,0.8)',
      }} />

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50, padding: '12px 24px',
        borderBottom: '1px solid rgba(74,63,160,0.2)',
        backdropFilter: 'blur(20px)', background: 'rgba(4,2,13,0.85)',
        display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <div onClick={() => router.push('/')} style={{ cursor: 'pointer', flexShrink: 0 }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontWeight: 900, fontSize: 14, letterSpacing: '0.15em', color: 'var(--violet)', lineHeight: 1 }}>PHANTOM</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'var(--purple-core)', letterSpacing: '0.3em' }}>SEARCH</div>
        </div>

        <div style={{
          flex: 1, maxWidth: 680, position: 'relative',
          background: 'rgba(18,15,46,0.8)', borderRadius: 12,
          border: isFocused ? '1px solid rgba(157,125,232,0.7)' : '1px solid rgba(74,63,160,0.3)',
          boxShadow: isFocused ? '0 0 0 3px rgba(124,92,191,0.12)' : 'none',
          transition: 'all 0.25s ease', backdropFilter: 'blur(20px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '4px 8px 4px 16px', gap: 10 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isFocused ? '#9d7de8' : '#4a3fa0'} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 15, color: 'var(--text-primary)', padding: '8px 0' }}
              autoComplete="off" spellCheck={false}
            />
            {query && (
              <button onClick={() => { setQuery(''); inputRef.current?.focus() }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>×</button>
            )}
            <button onClick={() => handleSearch()} style={{
              padding: '7px 16px', borderRadius: 8, border: 'none',
              background: 'linear-gradient(135deg, #7c5cbf, #9d7de8)',
              color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              fontFamily: 'Orbitron, monospace', letterSpacing: '0.05em',
            }}>GO</button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.15)', flexShrink: 0 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e676', boxShadow: '0 0 8px #00e676' }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#00e676' }}>ANONYMOUS</span>
        </div>
      </header>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
        {/* Loading skeleton */}
        {loading && (
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--purple-core)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--purple-bright)', animation: 'pulse-ring 1s ease-out infinite' }} />
              Searching anonymously for "{q}"…
            </div>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ marginBottom: 32, opacity: 1 - i * 0.12 }}>
                <div style={{ height: 12, width: '30%', background: 'rgba(74,63,160,0.3)', borderRadius: 6, marginBottom: 8, animation: 'shimmer 1.5s ease infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, rgba(74,63,160,0.2) 0%, rgba(157,125,232,0.3) 50%, rgba(74,63,160,0.2) 100%)' }} />
                <div style={{ height: 18, width: '70%', background: 'rgba(74,63,160,0.3)', borderRadius: 6, marginBottom: 8, animation: 'shimmer 1.5s ease 0.1s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, rgba(74,63,160,0.2) 0%, rgba(157,125,232,0.3) 50%, rgba(74,63,160,0.2) 100%)' }} />
                <div style={{ height: 12, width: '90%', background: 'rgba(74,63,160,0.2)', borderRadius: 6, animation: 'shimmer 1.5s ease 0.2s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, rgba(74,63,160,0.15) 0%, rgba(157,125,232,0.25) 50%, rgba(74,63,160,0.15) 100%)' }} />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div style={{ padding: '24px', borderRadius: 16, background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', color: '#e57373', marginBottom: 24 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠ Search error</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>{error}</div>
            {error.includes('API') && <div style={{ fontSize: 12, marginTop: 8, opacity: 0.6 }}>Add your SERP_API_KEY to .env.local for full results.</div>}
          </div>
        )}

        {data && !loading && (
          <div style={{ animation: 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            {/* Result meta */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                <span style={{ color: 'var(--purple-bright)' }}>{data.results.length}</span> anonymous results · {data.searchTime}s
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['All', 'News', 'Images'].map(t => (
                  <button key={t} style={{
                    padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(74,63,160,0.3)',
                    background: t === 'All' ? 'rgba(124,92,191,0.2)' : 'transparent',
                    color: t === 'All' ? 'var(--violet)' : 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}>{t}</button>
                ))}
              </div>
            </div>

            {/* Note about API */}
            {data.note && (
              <div style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(184,134,11,0.08)', border: '1px solid rgba(184,134,11,0.2)', marginBottom: 20, fontSize: 12, color: '#f5c542', fontFamily: 'JetBrains Mono, monospace' }}>
                ℹ {data.note}
              </div>
            )}

            {/* Results */}
            {data.results.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 14, marginBottom: 8 }}>No results found</div>
                <div style={{ fontSize: 13 }}>Try different search terms</div>
              </div>
            ) : (
              <div>
                {data.results.map((result, i) => (
                  <div key={i} style={{ marginBottom: 28, padding: '20px', borderRadius: 14, background: 'rgba(18,15,46,0.4)', border: '1px solid rgba(74,63,160,0.15)', backdropFilter: 'blur(10px)', transition: 'all 0.25s ease', cursor: 'pointer', animation: `slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.05}s both` }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = 'rgba(124,92,191,0.4)'
                      el.style.background = 'rgba(26,21,64,0.6)'
                      el.style.transform = 'translateX(4px)'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = 'rgba(74,63,160,0.15)'
                      el.style.background = 'rgba(18,15,46,0.4)'
                      el.style.transform = 'translateX(0)'
                    }}
                    onClick={() => window.open(result.url, '_blank', 'noopener,noreferrer')}>

                    {/* Domain + favicon */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 4, overflow: 'hidden', background: 'rgba(74,63,160,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <img src={result.favicon} alt="" width={16} height={16} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      </div>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-muted)' }}>{result.domain}</span>
                      {result.isAbstract && (
                        <span style={{ padding: '1px 7px', borderRadius: 4, background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)', fontSize: 9, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>FEATURED</span>
                      )}
                      {/* Anon shield */}
                      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#00e676', opacity: 0.6 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        ANON
                      </span>
                    </div>

                    {/* Title */}
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--purple-glow)', marginBottom: 8, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                      {result.title}
                    </h3>

                    {/* URL */}
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--accent-dim)', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {result.url}
                    </div>

                    {/* Description */}
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                      {result.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {data.results.length >= 10 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(74,63,160,0.15)' }}>
                {page > 1 && (
                  <button onClick={() => router.push(`/search?q=${encodeURIComponent(q)}&page=${page - 1}`)} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(74,63,160,0.3)', background: 'rgba(18,15,46,0.5)', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                    ← Previous
                  </button>
                )}
                {[...Array(5)].map((_, i) => {
                  const p = page - 2 + i
                  if (p < 1) return null
                  return (
                    <button key={p} onClick={() => router.push(`/search?q=${encodeURIComponent(q)}&page=${p}`)} style={{
                      width: 38, height: 38, borderRadius: 10, border: '1px solid rgba(74,63,160,0.3)',
                      background: p === page ? 'linear-gradient(135deg, #7c5cbf, #9d7de8)' : 'rgba(18,15,46,0.5)',
                      color: p === page ? 'white' : 'var(--text-secondary)', cursor: 'pointer',
                      fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: p === page ? 700 : 400,
                    }}>{p}</button>
                  )
                })}
                <button onClick={() => router.push(`/search?q=${encodeURIComponent(q)}&page=${page + 1}`)} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(74,63,160,0.3)', background: 'rgba(18,15,46,0.5)', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageInner />
    </Suspense>
  )
}
