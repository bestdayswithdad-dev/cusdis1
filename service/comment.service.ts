import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

export class CommentService {
  // Cusdis often requires a Project ID to validate the request
  private projectId = 'cbcd61ec-f2ef-425c-a952-30034c2de4e1';

  async getComments(pageId: string) {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('pageId', pageId)
      // If you aren't using an admin panel, auto-showing 'approved' is key
      .eq('approved', true) 
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data;
  }

  async addComment(body: { 
    content: string, 
    nickname: string, 
    email: string, 
    pageId: string, 
    parentId?: string 
  }) {
    const { data, error } = await supabase
      .from('comments')
      .insert([{ 
        content: body.content, 
        by_nickname: body.nickname, 
        by_email: body.email, 
        pageId: body.pageId,
        parentId: body.parentId || null, // Critical for threaded replies
        approved: true, 
        createdAt: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // This matches the specific hook Cusdis hits for moderation
  async approve(id: string) {
    const { data, error } = await supabase
      .from('comments')
      .update({ approved: true })
      .eq('id', id);
    if (error) throw error;
    return data;
  }

  // To satisfy the Cusdis 'Project' requirement
  async getProject() {
    return { id: this.projectId };
  }
}
