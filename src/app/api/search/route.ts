import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', '') } catch { return '' }
}

function getFavicon(url: string): string {
  return 'https://www.google.com/s2/favicons?domain=' + getDomain(url) + '&sz=32'
}

function buildUrl(base: string, params: Record<string, string>): string {
  const p = new URLSearchParams(params)
  return base + '?' + p.toString()
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1')
  const type = req.nextUrl.searchParams.get('type') || 'web'
  if (!q) return NextResponse.json({ error: 'Query required' }, { status: 400 })

  const apiKey = process.env.SERP_API_KEY
  const start = String((page - 1) * 10)

  const noCacheHeaders = {
    'Cache-Control': 'no-store, no-cache',
    'Referrer-Policy': 'no-referrer',
    'X-Robots-Tag': 'noindex',
    'X-Content-Type-Options': 'nosniff',
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: 'SERP_API_KEY not configured', results: [], total: 0, searchTime: '0', query: q, page, type },
      { status: 200, headers: noCacheHeaders }
    )
  }

  try {
    let results: any[] = []
    let total = 0
    let searchTime = '0.4'

    if (type === 'images') {
      const url = buildUrl('https://serpapi.com/search.json', {
        q, tbm: 'isch', start, api_key: apiKey, no_cache: 'true', safe: 'off'
      })
      const res = await fetch(url)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      results = (data.images_results || []).slice(0, 24).map((img: any) => ({
        type: 'images',
        title: img.title || '',
        url: img.link || img.original || '',
        imageUrl: img.thumbnail || img.original || '',
        originalUrl: img.original || img.link || '',
        domain: getDomain(img.link || img.original || ''),
        width: img.original_width || 0,
        height: img.original_height || 0,
      }))
      total = data.search_information?.total_results || results.length
      searchTime = data.search_information?.time_taken_displayed || '0.4'

    } else if (type === 'news') {
      const url = buildUrl('https://serpapi.com/search.json', {
        q, tbm: 'nws', start, api_key: apiKey, no_cache: 'true'
      })
      const res = await fetch(url)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      results = (data.news_results || []).map((n: any) => ({
        type: 'news',
        title: n.title || '',
        url: n.link || '',
        description: n.snippet || '',
        favicon: getFavicon(n.link || ''),
        domain: getDomain(n.link || ''),
        date: n.date || '',
        source: n.source || '',
        thumbnail: n.thumbnail || '',
      }))
      total = data.search_information?.total_results || results.length
      searchTime = data.search_information?.time_taken_displayed || '0.4'

    } else {
      const url = buildUrl('https://serpapi.com/search.json', {
        q, start, num: '10', api_key: apiKey, safe: 'off', no_cache: 'true'
      })
      const res = await fetch(url)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      results = (data.organic_results || []).map((r: any) => ({
        type: 'web',
        title: r.title || '',
        url: r.link || '',
        description: r.snippet || '',
        favicon: getFavicon(r.link || ''),
        domain: getDomain(r.link || ''),
        position: r.position || 0,
      }))
      total = data.search_information?.total_results || 0
      searchTime = data.search_information?.time_taken_displayed || '0.4'
    }

    return NextResponse.json(
      { results, total, searchTime, query: q, page, type },
      { headers: noCacheHeaders }
    )

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Search failed', results: [], total: 0, searchTime: '0', query: q, page, type },
      { status: 500, headers: noCacheHeaders }
    )
  }
}
