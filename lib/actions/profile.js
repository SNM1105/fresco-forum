"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getCurrentUserProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, school, program, avatar_url, avatar_position, avatar_scale, banner_url, banner_position")
    .eq("id", user.id)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { profile };
}

export async function updateProfile(formData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to sign in to edit your profile." };
  }

  const displayName = formData.get("display_name")?.toString().trim();
  const bio = formData.get("bio")?.toString().trim() || null;
  const school = formData.get("school")?.toString().trim() || null;
  const program = formData.get("program")?.toString().trim() || null;
  const avatarFile = formData.get("avatar");
  const bannerFile = formData.get("banner");
  const avatarPosition = formData.get("avatar_position")?.toString() || "50% 50%";
  const bannerPosition = formData.get("banner_position")?.toString() || "50% 50%";
  const avatarScale = Math.min(200, Math.max(100, Number.parseInt(formData.get("avatar_scale"), 10) || 100));

  if (!displayName || displayName.length < 1) {
    return { error: "Display name is required." };
  }

  if (displayName.length > 100) {
    return { error: "Display name is too long (max 100 characters)." };
  }

  if (bio && bio.length > 500) {
    return { error: "Bio is too long (max 500 characters)." };
  }

  // Verify this is actually the user's own profile
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("id, avatar_url, avatar_position, avatar_scale, banner_position")
    .eq("id", user.id)
    .single();

  if (fetchError || !profile) {
    return { error: "Profile not found." };
  }

  let avatarUrl = profile.avatar_url;
  let bannerUrl = null;

  // Handle avatar upload
  if (avatarFile && avatarFile.size > 0) {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

    if (avatarFile.size > MAX_SIZE) {
      return { error: "Avatar is too large (max 5MB)." };
    }
    if (!ALLOWED_TYPES.includes(avatarFile.type)) {
      return { error: "Avatar must be JPEG, PNG, or WebP." };
    }

    const avatarPath = `${user.id}/avatars/${crypto.randomUUID()}-${avatarFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-media")
      .upload(avatarPath, avatarFile, { contentType: avatarFile.type });

    if (uploadError) {
      return { error: "Failed to upload avatar: " + uploadError.message };
    }

    avatarUrl = avatarPath;
  }

  // Handle banner upload
  if (bannerFile && bannerFile.size > 0) {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

    if (bannerFile.size > MAX_SIZE) {
      return { error: "Banner is too large (max 10MB)." };
    }
    if (!ALLOWED_TYPES.includes(bannerFile.type)) {
      return { error: "Banner must be JPEG, PNG, or WebP." };
    }

    const bannerPath = `${user.id}/banners/${crypto.randomUUID()}-${bannerFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-media")
      .upload(bannerPath, bannerFile, { contentType: bannerFile.type });

    if (uploadError) {
      return { error: "Failed to upload banner: " + uploadError.message };
    }

    bannerUrl = bannerPath;
  }

  // Update the profile
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      bio: bio,
      school: school,
      program: program,
      avatar_url: avatarUrl,
      avatar_position: avatarPosition,
      avatar_scale: avatarScale,
      banner_position: bannerPosition,
      ...(bannerUrl && { banner_url: bannerUrl }),
    })
    .eq("id", user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  return { success: true };
}
