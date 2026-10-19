import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

const ADMIN_EMAIL = 'bestdayswithdad@gmail.com';

async function getGoogleAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google OAuth credentials not configured on server.');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'Failed to exchange refresh token');
  }

  return data.access_token;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // SECURITY GUARD 1: Verify Supabase Session
  const supabase = createPagesServerClient({ req, res });
  const { data: { session }, error: authError } = await supabase.auth.getSession();

  if (authError || !session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
  }

  // SECURITY GUARD 2: Explicit email lock to bestdayswithdad@gmail.com
  if (session.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Forbidden: Admin access only.' });
  }

  const { title, content, labels } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Post title and HTML content are required.' });
  }

  const blogId = process.env.BLOGGER_BLOG_ID;
  if (!blogId) {
    return res.status(500).json({ error: 'Server configuration error: BLOGGER_BLOG_ID missing.' });
  }

  try {
    const accessToken = await getGoogleAccessToken();

    // SECURITY GUARD 3: isDraft=true guarantees post is created ONLY as draft
    const bloggerResponse = await fetch(
      `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/?isDraft=true`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kind: 'blogger#post',
          title: String(title).trim(),
          content: String(content),
          labels: Array.isArray(labels) ? labels.map(l => String(l).trim()).filter(Boolean) : [],
        }),
      }
    );

    const postData = await bloggerResponse.json();

    if (!bloggerResponse.ok) {
      console.error('Blogger API error payload:', postData);
      return res.status(bloggerResponse.status).json({
        error: postData.error?.message || 'Blogger API rejection',
      });
    }

    return res.status(200).json({
      success: true,
      postId: postData.id,
      url: postData.url,
      draftUrl: `https://www.blogger.com/blog/post/edit/${blogId}/${postData.id}`,
    });
  } catch (error: any) {
    console.error('Server error creating Blogger draft:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
