"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createComment, deleteComment, getPostWithComments } from "@/lib/actions/comments";
import { deletePost } from "@/lib/actions/posts";
import { castVote } from "@/lib/actions/votes";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PostDetail({ params }) {
  const { id } = params;
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [userVotes, setUserVotes] = useState({});

  useEffect(() => {
    loadPost();
    loadUser();
  }, [id]);

  async function loadPost() {
    const result = await getPostWithComments(id);
    if (result.error) {
      console.error(result.error);
    } else {
      setPost(result.post);
      setComments(result.comments || []);
    }
    setLoading(false);
  }

  async function loadUser() {
    // Get current user info
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user);
  }

  async function handlePostComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    const result = await createComment(id, newComment);

    if (result.error) {
      alert(result.error);
    } else {
      setComments([result.comment, ...comments]);
      setNewComment("");
    }
    setSubmittingComment(false);
  }

  async function handleDeleteComment(commentId) {
    if (!confirm("Delete this comment?")) return;

    const result = await deleteComment(commentId);
    if (result.error) {
      alert(result.error);
    } else {
      setComments(comments.filter(c => c.id !== commentId));
    }
  }

  async function handleDeletePost() {
    if (!confirm("Delete this post? This cannot be undone.")) return;

    const result = await deletePost(id);
    if (result.error) {
      alert(result.error);
    } else {
      window.location.href = "/feed";
    }
  }

  async function handleVote(direction) {
    if (!user) {
      alert("Sign in to vote");
      return;
    }

    const currentVote = userVotes[id];
    let value = 0;
    
    if (direction === currentVote) {
      // Toggle off - send 0 to remove vote
      value = 0;
      setUserVotes(prev => ({ ...prev, [id]: null }));
    } else if (direction === 1) {
      value = 1;
      setUserVotes(prev => ({ ...prev, [id]: 1 }));
    } else {
      value = -1;
      setUserVotes(prev => ({ ...prev, [id]: -1 }));
    }
    
    await castVote({ targetType: "post", targetId: id, value, path: `/post/${id}` });
  }

  if (loading) {
    return <div className="p-6 text-center">Loading post...</div>;
  }

  if (!post) {
    return (
      <div className="p-6 text-center">
        <p>Post not found or has been removed.</p>
        <Link href="/feed" className="text-blue-500 hover:underline">
          Back to feed
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Back link */}
      <Link href="/feed" className="text-sm text-blue-500 hover:underline mb-4 inline-block">
        ← Back to feed
      </Link>

      {/* Post */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Link href={`/profile/${post.profiles?.username}`} className="font-semibold hover:underline">
                {post.profiles?.username}
              </Link>
              <span>•</span>
              <span>{new Date(post.created_at).toLocaleDateString()}</span>
              <span>•</span>
              <span className="text-gray-500">{post.profiles?.school}</span>
            </div>
          </div>

          {/* Delete button - only show if user is author */}
          {user?.id === post.author_id && (
            <button
              onClick={handleDeletePost}
              className="text-red-600 hover:text-red-800 text-sm font-semibold ml-4"
            >
              Delete
            </button>
          )}
        </div>

        {/* Body */}
        <div className="mb-4 text-gray-700">{post.body}</div>

        {/* Image */}
        {post.image_path && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <Image
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/post-media/${post.image_path}`}
              alt={post.title}
              width={post.image_width || 600}
              height={post.image_height || 400}
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Vote buttons */}
        <div className="flex gap-4 text-gray-600">
          <button
            onClick={() => handleVote(1)}
            className={`flex items-center gap-1 px-3 py-1 rounded hover:bg-gray-100 ${
              userVotes[id] === 1 ? "text-orange-500" : ""
            }`}
          >
            ▲ {post.vote_score > 0 ? post.vote_score : ""}
          </button>
          <button
            onClick={() => handleVote(-1)}
            className={`flex items-center gap-1 px-3 py-1 rounded hover:bg-gray-100 ${
              userVotes[id] === -1 ? "text-blue-500" : ""
            }`}
          >
            ▼
          </button>
          <span className="flex items-center gap-1 px-3 py-1">
            💬 {comments.length}
          </span>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Comments ({comments.length})</h2>

        {/* Comment form */}
        {user ? (
          <form onSubmit={handlePostComment} className="mb-6 pb-6 border-b">
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
            <button
              type="submit"
              disabled={submittingComment || !newComment.trim()}
              className="mt-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
            >
              {submittingComment ? "Posting..." : "Post comment"}
            </button>
          </form>
        ) : (
          <div className="mb-6 pb-6 border-b bg-gray-50 p-4 rounded">
            <p className="text-gray-600">
              <Link href="/login" className="text-blue-500 hover:underline">
                Sign in
              </Link>{" "}
              to comment
            </p>
          </div>
        )}

        {/* Comments list */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-gray-500 italic">No comments yet. Be the first!</p>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/profile/${comment.profiles?.username}`}
                      className="font-semibold text-sm hover:underline"
                    >
                      {comment.profiles?.username}
                    </Link>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Delete comment button */}
                  {user?.id === comment.author_id && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      Delete
                    </button>
                  )}
                </div>

                <p className="text-gray-700 mb-2">{comment.body}</p>

                <div className="flex gap-2 text-xs text-gray-600">
                  <button className="hover:bg-gray-200 px-2 py-1 rounded">
                    ▲ {comment.vote_score > 0 ? comment.vote_score : ""}
                  </button>
                  <button className="hover:bg-gray-200 px-2 py-1 rounded">▼</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
