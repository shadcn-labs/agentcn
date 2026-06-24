/**
 * Fetches a URL through Bright Data's Web Unlocker — handles YouTube reliably
 * at scale with no rate limits or bot blocks. Returns the raw response body.
 * Set BRIGHTDATA_API_KEY and (optionally) BRIGHTDATA_UNLOCKER_ZONE.
 * https://docs.brightdata.com/scraping-automation/web-unlocker
 */
export async function unlock(url: string): Promise<string> {
  const res = await fetch('https://api.brightdata.com/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.BRIGHTDATA_API_KEY ?? ''}`,
    },
    body: JSON.stringify({
      zone: process.env.BRIGHTDATA_UNLOCKER_ZONE ?? 'web_unlocker1',
      url,
      format: 'raw',
    }),
  })
  if (!res.ok) {
    throw new Error(`Web Unlocker request failed: ${res.status} ${res.statusText}`)
  }
  return res.text()
}

/** Extracts the YouTube video id from a watch, youtu.be, or embed URL. */
export function videoId(url: string): string {
  const u = new URL(url)
  return u.searchParams.get('v') ?? u.pathname.split('/').filter(Boolean).pop() ?? url
}

/**
 * Walks a balanced JSON object literal out of a page's HTML, starting at the
 * first `{` after `marker`. String-aware, so braces inside strings are ignored.
 */
export function extractJson<T = unknown>(html: string, marker: string): T | null {
  const at = html.indexOf(marker)
  if (at === -1) return null
  const begin = html.indexOf('{', at)
  if (begin === -1) return null
  let depth = 0
  let inStr = false
  let esc = false
  for (let i = begin; i < html.length; i++) {
    const ch = html[i]
    if (inStr) {
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') inStr = false
    } else if (ch === '"') {
      inStr = true
    } else if (ch === '{') {
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0) return JSON.parse(html.slice(begin, i + 1)) as T
    }
  }
  return null
}
