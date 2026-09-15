import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";
import { Avatar } from "@/components/ui";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ProfilePage({ params }) {
  const supabase = createClient();

  // Get the profile being viewed
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, school, program, reputation, school_verified")
    .eq("username", params.username)
    .single();

  if (!profile) notFound();

  // Get current user to check if this is their own profile
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwnProfile = user?.id === profile.id;

  const { data: posts } = await supabase
    .from("posts")
    .select(
      `id, title, body, image_path, status, vote_score, comment_count, created_at,
       categories ( key, label, category_group ),
      profiles ( username, display_name, avatar_url, school, program )`
    )
    .eq("author_id", profile.id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  return (
    <div className="flex-1 min-w-0 max-w-3xl">
      <div className="rounded-md overflow-hidden mb-5 border border-line bg-card">
        <div className="h-16" style={{ background: "linear-gradient(120deg, #B8502C, #2C4A6E)" }} />
        <div className="px-5 pb-5">
          <div className="flex items-start justify-between">
            <div className="-mt-8 mb-3">
              <Avatar name={profile.display_name || profile.username} url={profile.avatar_url} program={profile.program} size={72} />
            </div>
            {isOwnProfile && (
              <Link
                href="/profile/edit"
                className="mt-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm font-semibold"
              >
                Edit Profile
              </Link>
            )}
          </div>
          <h1 className="font-display font-semibold text-2xl text-ink">
            {profile.display_name || profile.username}
          </h1>
          {profile.bio && <p className="text-sm mt-0.5 text-ink-soft">{profile.bio}</p>}
          <div className="flex items-center gap-3 mt-2 text-xs text-ink-faint">
            {profile.school && <span>{profile.school}{profile.school_verified ? " · verified" : ""}</span>}
            {profile.program && <span>{profile.program}</span>}
          </div>
          <div className="flex items-center gap-5 mt-4 pt-4 border-t border-line">
            <div><span className="font-mono font-semibold text-sm text-ink">{profile.reputation}</span>
              <span className="text-xs ml-1 text-ink-faint">reputation</span></div>
            <div><span className="font-mono font-semibold text-sm text-ink">{posts?.length || 0}</span>
              <span className="text-xs ml-1 text-ink-faint">posts</span></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {posts?.map((p) => <PostCard key={p.id} post={p} currentUserId={user?.id} />)}
        {posts?.length === 0 && <p className="text-sm text-ink-faint text-center py-12">No posts yet.</p>}
      </div>
    </div>
  );
}
