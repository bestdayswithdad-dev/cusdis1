import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

export class CommentService {
  constructor(private req?: any) {
    // Re-linking the global window object for browser-side access
    if (typeof window !== 'undefined') {
      (window as any).supabaseClient = supabase;
    }
  }

  async getComments(pageId: string) {
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

  async addComment(body: { content: string, nickname: string, email: string, pageId: string, parentId?: string }) {
    const { data, error } = await supabase
      .from('comments')
      .insert([{ 
        content: body.content, 
        by_nickname: body.nickname, 
        by_email: body.email, 
        pageId: body.pageId,
        parentId: body.parentId || null,
        approved: true // Auto-approve enabled
      }]);

    if (error) throw error;
    return data;
  }

  async deleteComment(id: string) {
    const { data, error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return data;
  }

  async approve(id: string) {
    const { data, error } = await supabase
      .from('comments')
      .update({ approved: true })
      .eq('id', id);

    if (error) throw error;
    return data;
  }

 async getProject(commentId?: string) {
  return { 
    id: 'cbcd61ec-f2ef-425c-a952-30034c2de4e1',
    ownerId: 'admin' // Added this to satisfy the projectOwnerGuard type
  };
}
// Add the 'options' parameter as the 3rd argument
async addCommentAsModerator(parentId: string, content: string, options?: any) {
  const { data: parentComment } = await supabase
    .from('comments')
    .select('pageId')
    .eq('id', parentId)
    .single();

  const { data, error } = await supabase
    .from('comments')
    .insert([{ 
      content: content, 
      by_nickname: 'Dad', 
      by_email: 'admin@bestdayswithdad.com', 
      pageId: parentComment?.pageId,
      parentId: parentId,
      approved: true 
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}
  // Add this at the very bottom of service/comment.service.ts
export class CommentWrapper {
  constructor(private data: any) {}

  toJSON() {
    return {
      ...this.data,
      // Ensures dates are in the format the Cusdis widget expects
      createdAt: new Date(this.data.createdAt || Date.now()).getTime(),
      // Maps your Supabase 'by_nickname' to the 'nickname' field Cusdis expects
      nickname: this.data.by_nickname,
    }
  }
}
}
