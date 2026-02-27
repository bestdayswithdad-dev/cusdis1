import { createClient } from '@supabase/supabase-js'
// Add this interface to define the shape of a comment
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

 // Added timezoneOffset and options as optional arguments
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
// Add this interface above the class
interface CommentData {
  commentCount?: number;
  data?: any[];
  pageCount?: number;
  pageSize?: number;
  [key: string]: any;
}

export class CommentWrapper {
  // Explicitly declare these so the dashboard can "see" them
  public commentCount: number = 0;
  public pageCount: number = 0;
  public data: any[] = [];

  constructor(data: any) {
    // If the incoming data has these properties, assign them
    if (data && typeof data === 'object') {
      this.commentCount = data.commentCount || 0;
      this.pageCount = data.pageCount || 0;
      this.data = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
    }
  }

  toJSON() {
    return {
      commentCount: this.commentCount,
      pageCount: this.pageCount,
      data: this.data.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt || Date.now()).getTime(),
        nickname: item.by_nickname || 'Guest',
      })),
    };
  }
}

    return this.data;
  }
}
