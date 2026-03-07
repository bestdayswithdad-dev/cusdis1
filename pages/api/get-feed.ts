import { NextApiRequest, NextApiResponse } from 'next'

// Simple in-memory cache to prevent hitting Google too hard
let cachedFeed: any = null
let lastFetchTime = 0
const CACHE_DURATION = 300000 // 5 minutes in milliseconds

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Existing CORS headers for your project
  res.setHeader('Access-Control-Allow-Origin', 'https://www.bestdayswithdad.com')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') return res.status(200).end()

  const now = Date.now()

  // Return cached data if it's still fresh
  if (cachedFeed && (now - lastFetchTime < CACHE_DURATION)) {
    return res.status(200).json(cachedFeed)
  }

  try {
    const bloggerUrl = 'https://www.bestdayswithdad.com/feeds/posts/default?alt=json&max-results=100'
    const response = await fetch(bloggerUrl)

    if (!response.ok) {
      // If Google blocks Vercel, return the last known good cache if it exists
      if (cachedFeed) return res.status(200).json(cachedFeed)
      throw new Error(`Google responded with ${response.status}`)
    }

    const data = await response.json()
    
    // Update the cache
    cachedFeed = data
    lastFetchTime = now

    return res.status(200).json(data)
  } catch (error) {
    console.error('[GET /api/get-feed]', error)
    return res.status(500).json({ error: 'Failed to fetch Blogger feed from server' })
  }
}
