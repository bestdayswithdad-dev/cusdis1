import { createClient } from '@supabase/supabase-js'
import MarkdownIt from 'markdown-it'
import { getSession } from '../utils.server'

const md = new MarkdownIt()
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
export const supabase = createClient(supabaseUrl, supabaseKey)

export class CommentService {
  constructor(private req?: any) {}

  async getComments(pageId: string, timezoneOffset?: number, options?: any) {
    const { data, error } = await supabase
      .from('comments')
      .select('*, replies:comments(*)')
      .eq('pageId', pageId)
      .eq('projectId', '081c8a30-0550-4716-aae6-c553d7b545f6')
      .eq('approved', true)
      .is('parentId', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], commentCount: data?.length || 0 };
  }

  async getProject(commentId?: string) {
    const session = await getSession(this.req);
    const currentUid = (session as any)?.uid || 'admin';
    return { 
      id: '081c8a30-0550-4716-aae6-c553d7b545f6', 
      ownerId: currentUid 
    };
  }

  // ADD THIS BACK TO FIX THE BUILD ERROR
  async addCommentAsModerator(parentId: string, content: string, options?: any) {
    const { data: parentComment } = await supabase
      .from('comments')
      .select('pageId')
      .eq('id', parentId)
      .single();

    const { data, error } = await supabase
      .from('comments')
      .insert([{ 
        content, 
        by_nickname: 'Dad', 
        by_email: 'admin@bestdayswithdad.com', 
        pageId: parentComment?.pageId,
        projectId: '081c8a30-0550-4716-aae6-c553d7b545f6',
        parentId,
        approved: true 
      }])
      .select().single();

    if (error) throw error;
    return data;
  }

  async addComment(body: { content: string, nickname: string, email: string, pageId: string, parentId?: string }) {
    const { data, error } = await supabase
      .from('comments')
      .insert([{ 
        content: body.content, 
        by_nickname: body.nickname, 
        by_email: body.email, 
        pageId: body.pageId,
        projectId: '081c8a30-0550-4716-aae6-c553d7b545f6',
        parentId: body.parentId || null,
        approved: true 
      }])
      .select().single();

    if (error) throw error;
    return data;
  }

  async approve(id: string) {
    await supabase.from('comments').update({ approved: true }).eq('id', id);
  }

  async deleteComment(id: string) {
    await supabase.from('comments').delete().eq('id', id);
  }
}
