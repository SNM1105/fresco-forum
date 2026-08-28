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
    .select("id, username, display_name, bio, school, program, avatar_url")
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
    .select("id")
    .eq("id", user.id)
    .single();

  if (fetchError || !profile) {
    return { error: "Profile not found." };
  }

  // Update the profile
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      bio: bio,
      school: school,
      program: program,
    })
    .eq("id", user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  return { success: true };
}
