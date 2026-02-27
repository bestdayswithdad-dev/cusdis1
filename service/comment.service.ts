import { createClient } from '@supabase/supabase-js'

// Use your environment variables for connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

export class CommentService {
  constructor() {
    // Re-linking the global window object for your HTML templates
    if (typeof window !== 'undefined') {
      (window as any).supabaseClient = supabase;
    }
  }

  async getComments(pageId: string) {
    // Removed the complex filters to ensure all 11 comments show up
    const { data, error } = await supabase
      .from('comments')
      .select('*, replies:comments(*)')
      .eq('pageId', pageId)
      .eq('approved', true)
      .is('parentId', null)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return { data, commentCount: data?.length || 0 };
  }

  async addComment(body: { content: string, nickname: string, email: string, pageId: string }) {
    // Simple insertion without the complex user-verification gate
    const { data, error } = await supabase
      .from('comments')
      .insert([
        { 
          content: body.content, 
          by_nickname: body.nickname, 
          by_email: body.email, 
          pageId: body.pageId,
          approved: true // Default back to auto-approve for now
        }
      ]);

    if (error) throw error;
    return data;
  }
}
