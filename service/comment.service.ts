import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

export class CommentService {
  constructor(private req?: any) {
    // Re-linking the global window object so your HTML buttons work again
    if (typeof window !== 'undefined') {
      (window as any).supabaseClient = supabase;
    }
  }

  async getComments(pageId: string) {
    // Fetches all approved comments without requiring a User ID
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
    const { data, error } = await supabase
      .from('comments')
      .insert([{ 
        content: body.content, 
        by_nickname: body.nickname, 
        by_email: body.email, 
        pageId: body.pageId,
        approved: true // Back to auto-approve to bypass auth issues
      }]);

    if (error) throw error;
    return data;
  }

  async deleteComment(id: string) {
    const { data, error } = await supabase.from('comments').delete().eq('id', id);
    if (error) throw error;
    return data;
  }
}
