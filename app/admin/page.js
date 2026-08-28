import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ModQueue from "@/components/ModQueue";

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .single();

  if (!profile || !["moderator", "admin"].includes(profile.account_type)) {
    redirect("/feed");
  }

  const { data: pendingPosts } = await supabase
    .from("posts")
    .select("id, title, created_at, category_key, profiles ( username )")
    .eq("status", "pending_review")
    .order("created_at");

  const { data: openReports } = await supabase
    .from("reports")
    .select("id, target_type, target_id, reason, created_at, profiles ( username )")
    .eq("status", "open")
    .order("created_at");

  return (
    <div className="min-h-screen bg-plaster">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="font-display font-semibold text-2xl mb-1 text-ink">Moderation</h1>
        <p className="text-sm mb-8 text-ink-soft">
          Posts held for review, and reports waiting on a decision. Every action here logs a reason to
          <code className="mx-1 text-lapis">mod_actions</code>.
        </p>

        <ModQueue pendingPosts={pendingPosts || []} openReports={openReports || []} />
      </div>
    </div>
  );
}
