"use client";

import { Plus, Heart, MessageSquare, ImageIcon } from "lucide-react";
import { format } from "date-fns";

type Post = { id: string; user_id: string; content: string; media_url: string | null; post_type: string; created_at: string; profiles: { username: string; display_name: string } | null; is_liked: boolean; likes_count: number; };

interface FeedViewProps {
  posts: Post[];
  onLikePost: (postId: string) => void;
  onCreatePost: () => void;
}

export function FeedView({ posts, onLikePost, onCreatePost }: FeedViewProps) {
  return (
    <div className="relative z-10 flex flex-col min-h-screen pb-24">
      <header className="sticky top-0 z-20 bg-[#020617]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">G-Feed</h1>
        <button onClick={onCreatePost} className="p-2 rounded-full bg-emerald-500/20 text-emerald-400"><Plus className="h-5 w-5" /></button>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>No posts yet. Be the first to share!</p>
          </div>
        ) : posts.map((post) => (
          <div key={post.id} className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center font-bold">{post.profiles?.display_name?.charAt(0) || "U"}</div>
                <div>
                  <p className="font-medium text-white text-sm">{post.profiles?.display_name || "User"}</p>
                  <p className="text-xs text-gray-500">{format(new Date(post.created_at), "MMM d, HH:mm")}</p>
                </div>
              </div>
            </div>
            {post.content && <p className="px-3 pb-2 text-sm text-gray-200">{post.content}</p>}
            {post.media_url && <img src={post.media_url} alt="Post" className="w-full max-h-96 object-cover" />}
            <div className="p-3 flex items-center gap-4 border-t border-white/5">
              <button onClick={() => onLikePost(post.id)} className={`flex items-center gap-2 ${post.is_liked ? 'text-red-500' : 'text-gray-400'}`}>
                <Heart className={`h-5 w-5 ${post.is_liked ? 'fill-current' : ''}`} /><span className="text-sm">{post.likes_count || 0}</span>
              </button>
              <button className="flex items-center gap-2 text-gray-400"><MessageSquare className="h-5 w-5" /><span className="text-sm">Comment</span></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}