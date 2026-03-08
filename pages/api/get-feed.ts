import { NextApiRequest, NextApiResponse } from 'next'

// Mandatory Serialize Helper for BigInt (Project Requirement)
const serialize = (obj: any) => {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
};

let cachedFeed: any = null
let lastFetchTime = 0
const CACHE_DURATION = 600000 // 10 minutes to protect against the 429 block

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.bestdayswithdad.com')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') return res.status(200).end()

  const now = Date.now()

  // 1. Force serve cache if it exists (Emergency shield)
  if (cachedFeed && (now - lastFetchTime < CACHE_DURATION)) {
    return res.status(200).json(serialize(cachedFeed))
  }

  try {
    const bloggerUrl = 'https://www.bestdayswithdad.com/feeds/posts/default?alt=json&max-results=100'
    
    // 2. Abort if Google takes more than 5 seconds
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(bloggerUrl, { 
      signal: controller.signal,
      headers: { 'User-Agent': 'Vercel-Fetch-Proxy' } 
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      if (cachedFeed) return res.status(200).json(serialize(cachedFeed))
      throw new Error(`Google Blocked Proxy: ${response.status}`)
    }

    const data = await response.json()
    
    // 3. Update memory cache
    cachedFeed = data
    lastFetchTime = now

    return res.status(200).json(serialize(data))
  } catch (error: any) {
    console.error('[PROXY ERROR]', error.message)
    // 4. Final Fallback to avoid 500 crash
    if (cachedFeed) return res.status(200).json(serialize(cachedFeed))
    return res.status(200).json({ feed: { entry: [] }, error: true })
  }
}
