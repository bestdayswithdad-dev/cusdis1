import type { NextApiRequest, NextApiResponse } from 'next'

// Mandatory Serialize Helper for BigInt (Project Requirement)
const serialize = (obj: any) => {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
};

let cachedFeed: any = null
let lastFetchTime = 0
const CACHE_DURATION = 600000 // 10 minutes cache shield

const ALLOWED_ORIGINS = [
  'https://www.bestdayswithdad.com.au',
  'https://bestdayswithdad.com.au',
  'https://www.bestdayswithdad.com',
  'https://bestdayswithdad.com'
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const origin = req.headers.origin

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://www.bestdayswithdad.com.au')
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const now = Date.now()

  // 1. Force serve cache if it exists (Emergency shield)
  if (cachedFeed && (now - lastFetchTime < CACHE_DURATION)) {
    return res.status(200).json(serialize(cachedFeed))
  }

  try {
    // 2. Fetch directly from the active .com.au domain
    const bloggerUrl = 'https://www.bestdayswithdad.com.au/feeds/posts/default?alt=json&max-results=100'

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)

    const response = await fetch(bloggerUrl, { 
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Vercel-Fetch-Proxy/1.0)' } 
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      if (cachedFeed) return res.status(200).json(serialize(cachedFeed))
      throw new Error(`Google Feed Rejection: ${response.status}`)
    }

    const data = await response.json()

    // 3. Update memory cache
    cachedFeed = data
    lastFetchTime = now

    return res.status(200).json(serialize(data))
  } catch (error: any) {
    console.error('[PROXY ERROR]', error.message)
    // 4. Return cached fallback or safe empty feed to prevent frontend crashes
    if (cachedFeed) return res.status(200).json(serialize(cachedFeed))
    return res.status(200).json({ feed: { entry: [] }, error: true })
  }
}
