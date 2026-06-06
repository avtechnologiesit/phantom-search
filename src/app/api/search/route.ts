import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1')
  if (!q) return NextResponse.json({ error: 'Query required' }, { status: 400 })

  const apiKey = process.env.SERP_API_KEY
  const start = (page - 1) * 10

  try {
    if (apiKey) {
      // SerpAPI (Google results)
      const url = `https://serpapi.com/search.json?q=${encodeURIComponent(q)}&start=${start}&num=10&api_key=${apiKey}&safe=off&no_cache=true`
      const res = await fetch(url)
      const data = await res.json()

      const results = (data.organic_results || []).map((r: any) => ({
        title: r.title,
        url: r.link,
        description: r.snippet || '',
        favicon: `https://www.google.com/s2/favicons?domain=${new URL(r.link).hostname}&sz=32`,
        domain: new URL(r.link).hostname.replace('www.', ''),
        position: r.position,
      }))

      return NextResponse.json({
        results,
        total: data.search_information?.total_results || 0,
        searchTime: data.search_information?.time_taken_displayed || '0.4',
        query: q,
        page,
      }, {
        headers: {
          'Cache-Control': 'no-store',
          'X-Robots-Tag': 'noindex',
          'X-Content-Type-Options': 'nosniff',
        }
      })
    } else {
      // Fallback: DuckDuckGo instant answers + web results via HTML scraping proxy
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1&t=phantom_search`
      const res = await fetch(ddgUrl)
      const data = await res.json()

      // Build results from RelatedTopics + AbstractURL
      const results: any[] = []
      
      if (data.AbstractURL && data.AbstractText) {
        results.push({
          title: data.Heading || q,
          url: data.AbstractURL,
          description: data.AbstractText,
          favicon: `https://www.google.com/s2/favicons?domain=${new URL(data.AbstractURL).hostname}&sz=32`,
          domain: new URL(data.AbstractURL).hostname.replace('www.', ''),
          position: 1,
          isAbstract: true,
        })
      }

      (data.RelatedTopics || []).slice(0, 9).forEach((topic: any, i: number) => {
        if (topic.FirstURL && topic.Text) {
          try {
            const domain = new URL(topic.FirstURL).hostname.replace('www.', '')
            results.push({
              title: topic.Text.split(' - ')[0] || topic.Text.slice(0, 60),
              url: topic.FirstURL,
              description: topic.Text,
              favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
              domain,
              position: results.length + 1,
            })
          } catch {}
        }
      })

      return NextResponse.json({
        results: results.slice(0, 10),
        total: results.length,
        searchTime: '0.3',
        query: q,
        page,
        note: 'Using DuckDuckGo API. Add SERP_API_KEY env var for full Google results.',
      }, {
        headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' }
      })
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Search failed', detail: err.message }, { status: 500 })
  }
}
