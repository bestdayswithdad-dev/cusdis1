import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
