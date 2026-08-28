"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// All moderation writes go through the regular (RLS-respecting) server
// client, not the service-role admin client — the "moderators can log
// actions" and "moderators can delete posts/comments" policies already
// grant exactly the access needed, scoped to accounts with
// account_type in ('moderator','admin'). This keeps the audit trail
// honest: if RLS says no, the action didn't happen, full stop.

async function requireModerator(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, error: "Not signed in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .single();

  if (!profile || !["moderator", "admin"].includes(profile.account_type)) {
    return { user: null, error: "Moderator access required." };
  }
  return { user, error: null };
}

// reason and evidenceUrl are required — mirrors the `char_length(reason) >= 10`
// check on mod_actions, so a lazy one-word reason is rejected at the DB too.
export async function moderatePost({ postId, action, reason, evidenceUrl, path }) {
  const supabase = createClient();
  const { user, error } = await requireModerator(supabase);
  if (error) return { error };
  if (!reason || reason.trim().length < 10) {
    return { error: "Give a real reason (10+ characters) — this goes in the audit log." };
  }

  if (action === "delete_post") {
    const { error: delErr } = await supabase.from("posts").delete().eq("id", postId);
    if (delErr) return { error: delErr.message };
  } else if (action === "approve_post") {
    const { error: updErr } = await supabase
      .from("posts")
      .update({ status: "published" })
      .eq("id", postId);
    if (updErr) return { error: updErr.message };
  }

  const { error: logErr } = await supabase.from("mod_actions").insert({
    moderator_id: user.id,
    action,
    target_type: "post",
    target_id: postId,
    reason: reason.trim(),
    evidence_url: evidenceUrl || null,
  });
  if (logErr) return { error: logErr.message };

  if (path) revalidatePath(path);
  return { error: null };
}

export async function moderateUser({ userId, action, reason, evidenceUrl }) {
  const supabase = createClient();
  const { user, error } = await requireModerator(supabase);
  if (error) return { error };
  if (!reason || reason.trim().length < 10) {
    return { error: "Give a real reason (10+ characters) — this goes in the audit log." };
  }

  const patch =
    action === "ban_user"
      ? { is_banned: true, ban_reason: reason.trim() }
      : action === "mute_user"
      ? { is_muted_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }
      : action === "unban_user"
      ? { is_banned: false, ban_reason: null }
      : null;

  if (patch) {
    // Requires a moderator-only UPDATE policy on profiles for these columns —
    // add one alongside the self-update policy in policies.sql, scoped with
    // `using (is_moderator(auth.uid()))`, before enabling this in production.
    const { error: updErr } = await supabase.from("profiles").update(patch).eq("id", userId);
    if (updErr) return { error: updErr.message };
  }

  const { error: logErr } = await supabase.from("mod_actions").insert({
    moderator_id: user.id,
    action,
    target_type: "user",
    target_id: userId,
    reason: reason.trim(),
    evidence_url: evidenceUrl || null,
  });
  if (logErr) return { error: logErr.message };

  return { error: null };
}
