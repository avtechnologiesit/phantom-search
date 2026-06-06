import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1')
  const type = req.nextUrl.searchParams.get('type') || 'web' // web | news | images
  if (!q) return NextResponse.json({ error: 'Query required' }, { status: 400 })

  const apiKey = process.env.SERP_API_KEY
  const start = (page - 1) * 10

  const noCacheHeaders = {
    'Cache-Control': 'no-store, no-cache',
    'Referrer-Policy': 'no-referrer',
    'X-Robots-Tag': 'noindex',
    'X-Content-Type-Options': 'nosniff',
  }

  if (!apiKey) {
    return NextResponse.json({ error: 'SERP_API_KEY not configured', results: [], total: 0, searchTime: '0', query: q, page, type }, { status: 200, headers: noCacheHeaders })
  }

  try {
    let url: string
    let results: any[] = []
    let total = 0
    let searchTime = '0.4'

    if (type === 'images') {
      url = \`https://serpapi.com/search.json?q=\${encodeURIComponent(q)}&tbm=isch&start=\${start}&api_key=\${apiKey}&no_cache=true&safe=off\`
      const res = await fetch(url)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      results = (data.images_results || []).slice(0, 20).map((img: any) => ({
        type: 'image',
        title: img.title || '',
        url: img.link || img.original || '',
        imageUrl: img.thumbnail || img.original || '',
        originalUrl: img.original || img.link || '',
        domain: (() => { try { return new URL(img.link || img.original || 'https://unknown').hostname.replace('www.', '') } catch { return 'unknown' } })(),
        width: img.original_width || 0,
        height: img.original_height || 0,
      }))
      total = data.search_information?.total_results || results.length
      searchTime = data.search_information?.time_taken_displayed || '0.4'

    } else if (type === 'news') {
      url = \`https://serpapi.com/search.json?q=\${encodeURIComponent(q)}&tbm=nws&start=\${start}&api_key=\${apiKey}&no_cache=true\`
      const res = await fetch(url)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      results = (data.news_results || []).map((n: any) => ({
        type: 'news',
        title: n.title || '',
        url: n.link || '',
        description: n.snippet || '',
        favicon: \`https://www.google.com/s2/favicons?domain=\${(() => { try { return new URL(n.link).hostname } catch { return 'news.google.com' } })()}&sz=32\`,
        domain: (() => { try { return new URL(n.link).hostname.replace('www.', '') } catch { return '' } })(),
        date: n.date || '',
        source: n.source || '',
        thumbnail: n.thumbnail || '',
      }))
      total = data.search_information?.total_results || results.length
      searchTime = data.search_information?.time_taken_displayed || '0.4'

    } else {
      // Web (default)
      url = \`https://serpapi.com/search.json?q=\${encodeURIComponent(q)}&start=\${start}&num=10&api_key=\${apiKey}&safe=off&no_cache=true\`
      const res = await fetch(url)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      results = (data.organic_results || []).map((r: any) => ({
        type: 'web',
        title: r.title,
        url: r.link,
        description: r.snippet || '',
        favicon: \`https://www.google.com/s2/favicons?domain=\${(() => { try { return new URL(r.link).hostname } catch { return '' } })()}&sz=32\`,
        domain: (() => { try { return new URL(r.link).hostname.replace('www.', '') } catch { return '' } })(),
        position: r.position,
      }))
      total = data.search_information?.total_results || 0
      searchTime = data.search_information?.time_taken_displayed || '0.4'
    }

    return NextResponse.json({ results, total, searchTime, query: q, page, type }, { headers: noCacheHeaders })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Search failed', results: [], total: 0, searchTime: '0', query: q, page, type }, { status: 500, headers: noCacheHeaders })
  }
}
