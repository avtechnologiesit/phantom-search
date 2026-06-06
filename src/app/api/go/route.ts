import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// This route acts as a privacy redirect layer.
// The browser navigates to /go?u=<encoded-url> which then 302-redirects
// with Referrer-Policy: no-referrer so the destination never sees where
// the user came from. Because it is a server redirect, the intermediate
// /go URL appears in history (briefly) but the destination URL does NOT
// get added to browser history via the JS window.open path — instead
// we use <a rel="noreferrer noopener" target="_blank"> which opens a
// fresh tab with no referrer and no opener access.
export async function GET(req: NextRequest) {
  const dest = req.nextUrl.searchParams.get('u')
  if (!dest) return NextResponse.json({ error: 'Missing url' }, { status: 400 })

  let targetUrl: string
  try {
    targetUrl = decodeURIComponent(dest)
    new URL(targetUrl) // validate
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
  }

  // Block dangerous schemes
  if (!/^https?:\/\//i.test(targetUrl)) {
    return NextResponse.json({ error: 'Forbidden scheme' }, { status: 403 })
  }

  return new NextResponse(
    // Minimal HTML page that immediately redirects via meta-refresh
    // AND sets document.referrer to empty before leaving.
    // This page itself won't appear in history because it redirects instantly.
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="referrer" content="no-referrer">
  <title>Phantom Redirect</title>
  <style>body{background:#04020d;color:#9d7de8;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-size:13px;}</style>
</head>
<body>
  <span>🛡 Routing anonymously...</span>
  <script>
    // Replace current history entry so /go?u=... is NOT kept in history
    history.replaceState(null, '', '/search' + location.search.replace(/[?&]u=[^&]*/,'') || '/');
    // Navigate without referrer
    const a = document.createElement('a');
    a.href = ${JSON.stringify(targetUrl)};
    a.rel = 'noreferrer noopener';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    // Close this tab/navigate back after opening
    setTimeout(() => { window.close() || history.back(); }, 200);
  </script>
</body>
</html>`,
    {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Referrer-Policy': 'no-referrer',
        'X-Robots-Tag': 'noindex, nofollow',
        'Cache-Control': 'no-store, no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    }
  )
}
