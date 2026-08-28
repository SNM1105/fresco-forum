"use server";

import { createClient } from "@/lib/supabase/server";

export async function fileReport({ targetType, targetId, reason }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You need an account to report something." };
  if (!reason || reason.trim().length < 3) return { error: "Say a little about why." };

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    reason: reason.trim(),
  });

  return { error: error?.message ?? null };
}
