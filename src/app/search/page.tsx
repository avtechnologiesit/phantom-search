'use client'
import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type TabType = 'web' | 'news' | 'images'

interface BaseResult { type: TabType; title: string; url: string; domain: string }
interface WebResult extends BaseResult { type: 'web'; description: string; favicon: string; position: number }
interface NewsResult extends BaseResult { type: 'news'; description: string; favicon: string; date: string; source: string; thumbnail: string }
interface ImageResult extends BaseResult { type: 'images'; imageUrl: string; originalUrl: string; width: number; height: number }
type AnyResult = WebResult | NewsResult | ImageResult

interface SearchResponse {
  results: AnyResult[]
  total: number
  searchTime: string
  query: string
  page: number
  type: TabType
  error?: string
}

/* ── Open a URL anonymously: no referrer, no browser history entry ── */
function openAnon(url: string) {
  // We route via /api/go which strips referrer and replaces the history state
  const proxy = `/api/go?u=${encodeURIComponent(url)}`
  // Open in new tab. The tab briefly shows /api/go then closes itself,
  // leaving the destination open. The destination NEVER appears in
  // the SOURCE tab's history.
  const w = window.open('about:blank', '_blank', 'noopener,noreferrer')
  if (w) { w.location.href = proxy }
}

function SearchPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const tabParam = (searchParams.get('tab') as TabType) || 'web'

  const [query, setQuery] = useState(q)
  const [activeTab, setActiveTab] = useState<TabType>(tabParam)
  const [data, setData] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [lightboxImg, setLightboxImg] = useState<ImageResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const doSearch = useCallback(async (sq: string, sp: number, st: TabType) => {
    if (!sq.trim()) return
    setLoading(true); setError(''); setData(null); setProgress(0)
    const prog = setInterval(() => setProgress(w => Math.min(w + Math.random() * 18, 85)), 100)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(sq)}&page=${sp}&type=${st}`)
      const json: SearchResponse = await res.json()
      if (json.error && !json.results?.length) throw new Error(json.error)
      setData(json)
      setProgress(100)
      setTimeout(() => setProgress(0), 600)
    } catch (e: any) { setError(e.message); setProgress(0) }
    finally { clearInterval(prog); setLoading(false) }
  }, [])

  useEffect(() => { if (q) { setQuery(q); setActiveTab(tabParam); doSearch(q, page, tabParam) } }, [q, page, tabParam, doSearch])

  const go = (newQ?: string, newPage = 1, newTab: TabType = activeTab) => {
    const qVal = (newQ ?? query).trim()
    if (!qVal) return
    router.push(`/search?q=${encodeURIComponent(qVal)}&page=${newPage}&tab=${newTab}`)
  }

  const switchTab = (t: TabType) => { setActiveTab(t); go(q, 1, t) }

  const TABS: { id: TabType; label: string; icon: string }[] = [
    { id: 'web', label: 'All', icon: '🌐' },
    { id: 'news', label: 'News', icon: '📰' },
    { id: 'images', label: 'Images', icon: '🖼' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--void)', color: 'var(--text-primary)', overflowX: 'hidden' }}>

      {/* Progress bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, height: 2, zIndex: 200, width: `${progress}%`, background: 'linear-gradient(90deg,#7c5cbf,#e040fb,#00e5ff)', transition: progress === 100 ? 'opacity .5s ease .4s' : 'width .1s ease', opacity: progress === 0 ? 0 : 1, boxShadow: '0 0 8px rgba(157,125,232,.9)' }} />

      {/* ── HEADER ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(4,2,13,.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(74,63,160,.2)', padding: '10px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 900, margin: '0 auto' }}>

          {/* Logo */}
          <div onClick={() => router.push('/')} style={{ cursor: 'pointer', flexShrink: 0, display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{ fontFamily: 'Orbitron,monospace', fontWeight: 900, fontSize: 13, color: 'var(--violet)', letterSpacing: '.12em' }}>PHANTOM</span>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 7, color: 'var(--purple-core)', letterSpacing: '.25em' }}>SEARCH</span>
          </div>

          {/* Search bar */}
          <div style={{ flex: 1, position: 'relative', background: 'rgba(18,15,46,.85)', borderRadius: 12, border: focused ? '1px solid rgba(157,125,232,.7)' : '1px solid rgba(74,63,160,.35)', boxShadow: focused ? '0 0 0 3px rgba(124,92,191,.12)' : 'none', transition: 'all .2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px 0 14px', gap: 8 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={focused ? '#9d7de8' : '#4a3fa0'} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && go(query, 1, activeTab)}
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 15, color: 'var(--text-primary)', padding: '10px 0' }}
                autoComplete="off" spellCheck={false} placeholder="Search anonymously…" />
              {query && <button onClick={() => { setQuery(''); inputRef.current?.focus() }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, padding: '0 2px', lineHeight: 1 }}>×</button>}
              <button onClick={() => go(query, 1, activeTab)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#7c5cbf,#9d7de8)', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Orbitron,monospace', letterSpacing: '.04em', whiteSpace: 'nowrap' }}>GO</button>
            </div>
          </div>

          {/* Anon badge — desktop only */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 20, background: 'rgba(0,230,118,.06)', border: '1px solid rgba(0,230,118,.15)', flexShrink: 0, whiteSpace: 'nowrap' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e676', boxShadow: '0 0 6px #00e676' }} />
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#00e676' }}>ANON</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, maxWidth: 900, margin: '8px auto 0', paddingLeft: 4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => switchTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 14px', borderRadius: 20, border: activeTab === t.id ? '1px solid rgba(157,125,232,.6)' : '1px solid transparent', background: activeTab === t.id ? 'rgba(124,92,191,.2)' : 'transparent', color: activeTab === t.id ? 'var(--violet)' : 'var(--text-muted)', fontSize: 13, fontWeight: activeTab === t.id ? 600 : 400, cursor: 'pointer', transition: 'all .18s ease' }}>
              <span style={{ fontSize: 14 }}>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main style={{ maxWidth: activeTab === 'images' ? 1100 : 760, margin: '0 auto', padding: '24px 16px 60px' }}>

        {/* Loading skeletons */}
        {loading && (
          <div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: 'var(--purple-core)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--purple-bright)', animation: 'pulse-ring 1s ease-out infinite' }} />
              Searching anonymously…
            </div>
            {activeTab === 'images' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10 }}>
                {[...Array(12)].map((_,i) => <div key={i} style={{ height: 140, borderRadius: 10, background: 'rgba(74,63,160,.2)', animation: 'pulse-ring 1.5s ease infinite' }} />)}
              </div>
            ) : (
              [...Array(5)].map((_,i) => (
                <div key={i} style={{ marginBottom: 28, opacity: 1 - i * .15 }}>
                  {[['30%',10],['65%',16],['90%',10]].map(([w,h],j) => (
                    <div key={j} style={{ height: h as number, width: w as string, borderRadius: 6, marginBottom: 8, background: 'linear-gradient(90deg,rgba(74,63,160,.18) 0%,rgba(157,125,232,.28) 50%,rgba(74,63,160,.18) 100%)', backgroundSize: '200% 100%', animation: `shimmer 1.4s ease ${j*.1}s infinite` }} />
                  ))}
                </div>
              ))
            )}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ padding: '20px', borderRadius: 14, background: 'rgba(192,57,43,.1)', border: '1px solid rgba(192,57,43,.3)', color: '#e57373' }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠ Search error</div>
            <div style={{ fontSize: 13, opacity: .8 }}>{error}</div>
          </div>
        )}

        {/* Results */}
        {data && !loading && !error && (
          <div style={{ animation: 'fade-in .35s ease' }}>

            {/* Meta row */}
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', marginBottom: 18 }}>
              <span style={{ color: 'var(--purple-bright)' }}>{data.results.length}</span> anonymous results · {data.searchTime}s · no tracking
            </div>

            {/* ── WEB RESULTS ── */}
            {activeTab === 'web' && (
              <div>
                {data.results.length === 0 ? (
                  <EmptyState />
                ) : (
                  (data.results as WebResult[]).map((r, i) => (
                    <div key={i} onClick={() => openAnon(r.url)}
                      style={{ marginBottom: 22, padding: '18px 20px', borderRadius: 14, background: 'rgba(18,15,46,.45)', border: '1px solid rgba(74,63,160,.18)', backdropFilter: 'blur(8px)', cursor: 'pointer', transition: 'all .2s ease', animation: `slide-up .4s ease ${i*.04}s both` }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor='rgba(124,92,191,.45)'; el.style.background='rgba(26,21,64,.65)'; el.style.transform='translateX(3px)' }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor='rgba(74,63,160,.18)'; el.style.background='rgba(18,15,46,.45)'; el.style.transform='translateX(0)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                        <img src={r.favicon} alt="" width={16} height={16} style={{ borderRadius: 3, flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: 'var(--text-muted)' }}>{r.domain}</span>
                        <span style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#00e676', opacity: .6, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>ANON
                        </span>
                      </div>
                      <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--purple-glow)', marginBottom: 7, lineHeight: 1.3, letterSpacing: '-.01em' }}>{r.title}</h3>
                      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'var(--accent-dim)', marginBottom: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.url}</div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{r.description}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── NEWS RESULTS ── */}
            {activeTab === 'news' && (
              <div>
                {data.results.length === 0 ? <EmptyState label="No news found" /> : (
                  (data.results as NewsResult[]).map((r, i) => (
                    <div key={i} onClick={() => openAnon(r.url)}
                      style={{ marginBottom: 16, padding: '16px', borderRadius: 14, background: 'rgba(18,15,46,.45)', border: '1px solid rgba(74,63,160,.18)', cursor: 'pointer', transition: 'all .2s ease', animation: `slide-up .35s ease ${i*.04}s both`, display: 'flex', gap: 14, alignItems: 'flex-start' }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor='rgba(124,92,191,.45)'; el.style.background='rgba(26,21,64,.65)' }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor='rgba(74,63,160,.18)'; el.style.background='rgba(18,15,46,.45)' }}>
                      {r.thumbnail && (
                        <img src={r.thumbnail} alt="" style={{ width: 90, height: 65, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                          <img src={r.favicon} alt="" width={14} height={14} style={{ borderRadius: 2 }} onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'var(--purple-core)' }}>{r.source || r.domain}</span>
                          {r.date && <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'var(--text-dim)' }}>· {r.date}</span>}
                        </div>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--purple-glow)', marginBottom: 6, lineHeight: 1.35 }}>{r.title}</h3>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── IMAGE RESULTS ── */}
            {activeTab === 'images' && (
              <div>
                {data.results.length === 0 ? <EmptyState label="No images found" /> : (
                  <div style={{ columns: 'auto 160px', gap: 10, columnFill: 'balance' }}>
                    {(data.results as ImageResult[]).map((r, i) => (
                      <div key={i} onClick={() => setLightboxImg(r)}
                        style={{ breakInside: 'avoid', marginBottom: 10, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', position: 'relative', animation: `fade-in .3s ease ${i*.03}s both`, border: '1px solid rgba(74,63,160,.15)' }}
                        onMouseEnter={e => { (e.currentTarget.querySelector('.img-overlay') as HTMLElement)!.style.opacity='1' }}
                        onMouseLeave={e => { (e.currentTarget.querySelector('.img-overlay') as HTMLElement)!.style.opacity='0' }}>
                        <img src={r.imageUrl} alt={r.title} style={{ width: '100%', display: 'block', borderRadius: 10 }} loading="lazy" onError={e => { (e.target as HTMLImageElement).closest('div')!.style.display='none' }} />
                        <div className="img-overlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(4,2,13,.9) 0%,transparent 50%)', opacity: 0, transition: 'opacity .2s ease', borderRadius: 10, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '10px' }}>
                          <div style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'var(--purple-bright)', marginTop: 2 }}>{r.domain}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pagination — web & news only */}
            {activeTab !== 'images' && data.results.length >= 10 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 36, paddingTop: 20, borderTop: '1px solid rgba(74,63,160,.15)', flexWrap: 'wrap' }}>
                {page > 1 && <PagBtn label="← Prev" onClick={() => go(q, page - 1, activeTab)} />}
                {[...Array(5)].map((_,i) => { const p=page-2+i; if(p<1) return null; return <PagBtn key={p} label={String(p)} active={p===page} onClick={() => go(q, p, activeTab)} /> })}
                <PagBtn label="Next →" onClick={() => go(q, page + 1, activeTab)} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── IMAGE LIGHTBOX ── */}
      {lightboxImg && (
        <div onClick={() => setLightboxImg(null)} style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(4,2,13,.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(10px)' }}>
          <button onClick={e => { e.stopPropagation(); setLightboxImg(null) }} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(74,63,160,.3)', border: '1px solid rgba(74,63,160,.4)', borderRadius: 20, color: 'var(--text-primary)', width: 36, height: 36, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          <img src={lightboxImg.originalUrl || lightboxImg.imageUrl} alt={lightboxImg.title} style={{ maxWidth: '90vw', maxHeight: '75vh', objectFit: 'contain', borderRadius: 12, boxShadow: '0 0 60px rgba(124,92,191,.3)' }} onClick={e => e.stopPropagation()} />
          <div style={{ marginTop: 14, textAlign: 'center', maxWidth: 500 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6 }}>{lightboxImg.title}</div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: 'var(--purple-core)', marginBottom: 12 }}>{lightboxImg.domain}</div>
            <button onClick={e => { e.stopPropagation(); openAnon(lightboxImg.url) }} style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c5cbf,#9d7de8)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, margin: '0 auto' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Visit anonymously
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PagBtn({ label, onClick, active }: { label: string; onClick: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(74,63,160,.3)', background: active ? 'linear-gradient(135deg,#7c5cbf,#9d7de8)' : 'rgba(18,15,46,.5)', color: active ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'JetBrains Mono,monospace', fontSize: 12, fontWeight: active ? 700 : 400, minWidth: 36, transition: 'all .15s' }}>
      {label}
    </button>
  )
}

function EmptyState({ label = 'No results found' }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 40, marginBottom: 14 }}>🔍</div>
      <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 14, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 13 }}>Try a different search term</div>
    </div>
  )
}

export default function SearchPage() {
  return <Suspense><SearchPageInner /></Suspense>
}
