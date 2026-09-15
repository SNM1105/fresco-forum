"use server";

import { createClient } from "@/lib/supabase/server";

export async function createComment(postId, body, parentId = null) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to sign in to comment." };
  }

  if (!body || body.trim().length < 1) {
    return { error: "Comment can't be empty." };
  }

  if (body.length > 5000) {
    return { error: "Comment is too long (max 5000 characters)." };
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      author_id: user.id,
      parent_id: parentId,
      body: body.trim(),
    })
    .select("id, body, vote_score, created_at, author_id, parent_id")
    .single();

  if (error) {
    return { error: error.message };
  }

  // Fetch the author profile to return display info
  const { data: author } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .single();

  return {
    success: true,
    comment: {
      ...data,
      author: author,
    },
  };
}

export async function deleteComment(commentId) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to sign in." };
  }

  // Check if user is the author or a moderator
  const { data: comment, error: fetchError } = await supabase
    .from("comments")
    .select("author_id, post_id")
    .eq("id", commentId)
    .single();

  if (fetchError || !comment) {
    return { error: "Comment not found." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .single();

  const isMod = profile?.account_type === "moderator" || profile?.account_type === "admin";
  const isAuthor = comment.author_id === user.id;

  if (!isAuthor && !isMod) {
    return { error: "You can't delete this comment." };
  }

  // Update comment status to 'removed' instead of hard delete
  const { error } = await supabase
    .from("comments")
    .update({ status: "removed" })
    .eq("id", commentId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function getPostWithComments(postId) {
  const supabase = createClient();

  // Get the post
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select(
      `
      id, title, body, image_path, image_width, image_height, 
      category_key, status, vote_score, comment_count, created_at,
      author_id,
      profiles (username, avatar_url, school, program)
    `
    )
    .eq("id", postId)
    .eq("status", "published")
    .single();

  if (postError || !post) {
    return { error: "Post not found." };
  }

  // Get comments (top-level only for now, we'll handle threading in UI)
  const { data: comments, error: commentsError } = await supabase
    .from("comments")
    .select(
      `
      id, body, vote_score, created_at, author_id, parent_id,
      profiles (username, avatar_url, school, program)
    `
    )
    .eq("post_id", postId)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (commentsError) {
    return { error: commentsError.message };
  }

  return { post, comments };
}
