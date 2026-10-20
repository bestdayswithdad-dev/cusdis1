import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ALLOWED_ORIGINS = [
  'https://www.bestdayswithdad.com.au',
  'https://bestdayswithdad.com.au',
  'https://www.bestdayswithdad.com',
  'https://bestdayswithdad.com'
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const origin = req.headers.origin;

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://www.bestdayswithdad.com.au');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'OPTIONS']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { emails } = req.query;

  if (!emails || typeof emails !== 'string') {
    return res.status(400).json({ error: 'Query parameter "emails" is required (comma-separated).' });
  }

  // Cache at Edge for 60 seconds so tier changes update fast
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

  const emailList = Array.from(
    new Set(
      emails
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(e => e && e.includes('@') && !e.includes('guest@') && !e.includes('.local'))
    )
  );

  if (emailList.length === 0) {
    return res.status(200).json({});
  }

  try {
    const results: Record<string, any> = {};

    await Promise.all(
      emailList.map(async (email) => {
        const { data, error } = await supabase.rpc('get_user_contributor_tier', {
          target_email: email,
        });
        if (!error && data) {
          results[email] = data;
        }
      })
    );

    return res.status(200).json(results);
  } catch (err: any) {
    console.error('User tier resolution error:', err);
    return res.status(500).json({ error: err.message || 'Failed to resolve tiers' });
  }
}
