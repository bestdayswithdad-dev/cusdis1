import { createClient } from '@supabase/supabase-js'
import MarkdownIt from 'markdown-it'

// 1. Initialize Markdown Helper
const md = new MarkdownIt()

// 2. Interfaces
export interface CommentItem {
  id: string;
  content: string;
  by_nickname: string;
  by_email: string;
  pageId: string;
  parentId?: string | null;
  approved: boolean;
  createdAt: string | number;
  replies?: CommentItem[];
}

interface CommentData {
  commentCount?: number;
  data?: any[];
  pageCount?: number;
  pageSize?: number;
  [key: string]: any;
}

// 3. Supabase Client Setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

// 4. Main Service Class
export class CommentService {
  constructor(private req?: any) {
    if (typeof window !== 'undefined') {
      (window as any).supabaseClient = supabase;
    }
  }

  async getComments(pageId: string, timezoneOffset?: number, options?: any) {
    const { data, error } = await supabase
      .from('comments')
      .select('*, replies:comments(*)')
      .eq('pageId', pageId)
      .eq('approved', true)
      .is('parentId', null)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return { data: data || [], commentCount: data?.length || 0 };
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
        approved: true 
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteComment(id: string) {
    const { data, error } = await supabase.from('comments').delete().eq('id', id);
    if (error) throw error;
    return data;
  }

  async approve(id: string) {
    const { data, error } = await supabase.from('comments').update({ approved: true }).eq('id', id);
    if (error) throw error;
    return data;
  }

  async getProject(commentId?: string) {
    return { 
      id: 'cbcd61ec-f2ef-425c-a952-30034c2de4e1',
      ownerId: 'admin' 
    };
  }

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
}

// Add this interface above the class
interface CommentData {
  commentCount?: number;
  data?: any[];
  pageCount?: number;
  pageSize?: number;
  [key: string]: any;
}

export class CommentWrapper {
  // Using 'any' here is the shortcut to bypass the "overlap" error
  constructor(public data: any) {}

  toJSON(): any {
    // If we have an empty state object (no comments found)
    if (this.data && typeof this.data === 'object' && !Array.isArray(this.data)) {
      return {
        commentCount: this.data.commentCount ?? 0,
        data: this.data.data ?? [],
        pageCount: this.data.pageCount ?? 0,
        pageSize: this.data.pageSize ?? 0
      };
    }

    // If we have an array of actual comments
    if (Array.isArray(this.data)) {
      return this.data.map(item => ({
        ...item,
        createdAt: new Date(item.createdAt || Date.now()).getTime(),
        nickname: item.by_nickname || 'Guest',
      }));
    }

    return this.data;
  }
}

// 6. Exported Helper
export const markdown = (content: string) => {
  return md.render(content)
}
