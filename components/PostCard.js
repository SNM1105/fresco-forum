"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { castVote } from "@/lib/actions/votes";
import { fileReport } from "@/lib/actions/reports";
import { deletePost } from "@/lib/actions/posts";
import { Avatar, CategoryLabel } from "./ui";

export default function PostCard({ post, currentUserVote = 0, currentUserId = null }) {
  const [score, setScore] = useState(post.vote_score);
  const [myVote, setMyVote] = useState(currentUserVote);
  const [isDeleting, setIsDeleting] = useState(false);
  const [, startTransition] = useTransition();
  const isArt = post.categories.category_group === "art";

  const vote = (next) => {
    const applied = myVote === next ? 0 : next;
    setScore(score - myVote + applied);
    setMyVote(applied);
    startTransition(() => {
      castVote({ targetType: "post", targetId: post.id, value: applied, path: "/feed" });
    });
  };

  const report = () => {
    const reason = window.prompt("What's wrong with this post?");
    if (reason) fileReport({ targetType: "post", targetId: post.id, reason });
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    
    setIsDeleting(true);
    const result = await deletePost(post.id);
    if (result.error) {
      alert(result.error);
      setIsDeleting(false);
    } else {
      window.location.reload();
    }
  };

  const imageUrl = post.image_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/post-media/${post.image_path}`
    : null;

  return (
    <article className="rounded-md overflow-hidden border border-line bg-card hover:shadow-md transition-shadow">
      {isArt && <div className="h-[3px] bg-sienna" />}
      <div className="p-4 sm:p-5 flex gap-4">
        <div className="flex flex-col items-center gap-1 pt-1 flex-shrink-0">
          <button onClick={() => vote(1)} aria-label="Upvote" className="p-0.5 rounded hover:bg-black/5">
            <span className={myVote === 1 ? "text-sienna" : "text-ink-faint"}>▲</span>
          </button>
          <span className="font-mono text-xs font-medium text-ink">{score}</span>
          <button onClick={() => vote(-1)} aria-label="Downvote" className="p-0.5 rounded hover:bg-black/5">
            <span className={myVote === -1 ? "text-lapis" : "text-ink-faint"}>▼</span>
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <CategoryLabel group={post.categories.category_group} label={post.categories.label} />
            {post.status === "pending_review" && (
              <span className="font-mono text-[10px] text-lapis">AWAITING REVIEW</span>
            )}
          </div>

          <Link href={`/post/${post.id}`}>
            <h3 className="font-display font-semibold text-lg leading-snug mb-1 text-ink">{post.title}</h3>
          </Link>
          {post.body && <p className="text-sm leading-relaxed mb-3 text-ink-soft line-clamp-3">{post.body}</p>}

          {imageUrl && (
            <div className="mb-3 rounded overflow-hidden border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="w-full object-cover" style={{ maxHeight: 420 }} />
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-2">
            <Link href={`/profile/${post.profiles.username}`} className="flex items-center gap-2 group">
              <Avatar name={post.profiles.display_name || post.profiles.username} url={post.profiles.avatar_url} size={22} />
              <span className="text-xs text-ink-soft">
                <span className="font-medium group-hover:underline text-ink">
                  {post.profiles.display_name || post.profiles.username}
                </span>
                {post.profiles.school ? ` · ${post.profiles.school}` : ""}
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href={`/post/${post.id}`} className="text-xs text-ink-faint">
                {post.comment_count} comments
              </Link>
              {currentUserId === post.author_id && (
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-xs text-sienna hover:underline disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              )}
              <button onClick={report} className="text-xs text-ink-faint hover:underline">
                Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
