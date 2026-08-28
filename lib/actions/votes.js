"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// value: 1 (upvote), -1 (downvote), or 0 (remove the user's vote).
// Relies entirely on RLS ("users manage their own votes") plus the
// unique(user_id, target_type, target_id) constraint — no need to
// check ownership here, Postgres does it.
export async function castVote({ targetType, targetId, value, path }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need an account to vote." };
  }

  if (value === 0) {
    const { error } = await supabase
      .from("votes")
      .delete()
      .match({ user_id: user.id, target_type: targetType, target_id: targetId });
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("votes")
      .upsert(
        { user_id: user.id, target_type: targetType, target_id: targetId, value },
        { onConflict: "user_id,target_type,target_id" }
      );
    if (error) return { error: error.message };
  }

  if (path) revalidatePath(path);
  return { error: null };
}
