import { NextApiRequest, NextApiResponse } from 'next'

// Simple in-memory cache
let cachedFeed: any = null
let lastFetchTime = 0
const CACHE_DURATION = 300000 // 5 minutes

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Mandatory CORS Headers for Blogger
  res.setHeader('Access-Control-Allow-Origin', 'https://www.bestdayswithdad.com')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') return res.status(200).end()

  const now = Date.now()

  // 2. Serve Cache if available (Prevents 500s during Google hiccups)
  if (cachedFeed && (now - lastFetchTime < CACHE_DURATION)) {
    return res.status(200).json(cachedFeed)
  }

  try {
    const bloggerUrl = 'https://www.bestdayswithdad.com/feeds/posts/default?alt=json&max-results=100'
    
    // 3. Fetch with a Timeout to prevent Vercel "Hanging"
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 8000) // 8 second timeout

    const response = await fetch(bloggerUrl, { 
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
    })
    
    clearTimeout(id)

    if (!response.ok) {
      if (cachedFeed) return res.status(200).json(cachedFeed)
      throw new Error(`Blogger responded with ${response.status}`)
    }

    const data = await response.json()
    
    // 4. Update memory cache
    cachedFeed = data
    lastFetchTime = now

    return res.status(200).json(data)
  } catch (error: any) {
    console.error('[PROXY ERROR]', error.message)
    
    // 5. Emergency Fallback: If everything fails, send back the last known good data
    if (cachedFeed) {
        return res.status(200).json(cachedFeed)
    }
    
    return res.status(500).json({ error: 'Feed currently unavailable', details: error.message })
  }
}
