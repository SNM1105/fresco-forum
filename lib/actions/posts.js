"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createPost(formData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need an account to post." };
  }

  const title = formData.get("title")?.toString().trim();
  const body = formData.get("body")?.toString().trim();
  const categoryKey = formData.get("category")?.toString();
  const file = formData.get("image");

  if (!title || title.length < 3) {
    return { error: "Give it a title — at least 3 characters." };
  }
  if (!categoryKey) {
    return { error: "Pick a category." };
  }

  let imagePath = null;
  let imageWidth = null;
  let imageHeight = null;

  if (file && file.size > 0) {
    // Client already checks size/type/dimensions before submit (see
    // components/CreatePostForm.js) — this is the server-side backstop.
    const MAX_BYTES = 25 * 1024 * 1024;
    const ALLOWED = ["image/jpeg", "image/png", "image/webp", "video/mp4"];
    if (file.size > MAX_BYTES) return { error: "File is over the 25MB limit." };
    if (!ALLOWED.includes(file.type)) return { error: "Unsupported file type." };

    const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("post-media")
      .upload(path, file, { contentType: file.type });
    if (uploadError) return { error: uploadError.message };
    imagePath = path;
    // Real width/height extraction happens via a sharp/probe-image-size
    // call in a route handler or edge function — omitted here for brevity.
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      category_key: categoryKey,
      title,
      body,
      image_path: imagePath,
      image_width: imageWidth,
      image_height: imageHeight,
      // status is intentionally NOT set here — before_post_insert trigger
      // decides published vs. pending_review from the category, so a
      // tampered client request can't force a political post live.
    })
    .select("id, status")
    .single();

  if (error) return { error: error.message };

  redirect(data.status === "pending_review" ? "/feed?submitted=pending" : `/feed`);
}

export async function deletePost(postId) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to sign in." };
  }

  // Check if user is the author or a moderator
  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .single();

  if (fetchError || !post) {
    return { error: "Post not found." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .single();

  const isMod = profile?.account_type === "moderator" || profile?.account_type === "admin";
  const isAuthor = post.author_id === user.id;

  if (!isAuthor && !isMod) {
    return { error: "You can't delete this post." };
  }

  // Update post status to 'removed' instead of hard delete
  const { error } = await supabase
    .from("posts")
    .update({ status: "removed" })
    .eq("id", postId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
