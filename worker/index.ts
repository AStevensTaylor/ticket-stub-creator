/**
 * Cloudflare Worker entry. The app is a static single-page application served
 * from the ASSETS binding; this worker only adds security headers on top and
 * answers a small health-check endpoint.
 */
interface Env {
  ASSETS: Fetcher
}

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/healthz') {
      return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } })
    }
    const response = await env.ASSETS.fetch(request)
    const headers = new Headers(response.headers)
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v)
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
  },
} satisfies ExportedHandler<Env>
