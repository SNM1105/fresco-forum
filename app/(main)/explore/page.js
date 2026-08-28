import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";

export default async function ExplorePage({ searchParams }) {
  const supabase = createClient();
  const q = searchParams?.q?.trim();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const baseSelect = `id, title, body, image_path, status, vote_score, comment_count, created_at,
     categories ( key, label, category_group ),
     profiles ( username, display_name, avatar_url, school )`;

  let results = null;
  if (q) {
    // Simple ilike search across title/body plus joined school/username.
    // For real scale, replace with a Postgres full-text search column
    // (tsvector) + GIN index — this is fine for an MVP's data volume.
    const { data } = await supabase
      .from("posts")
      .select(baseSelect)
      .eq("status", "published")
      .or(`title.ilike.%${q}%,body.ilike.%${q}%`)
      .limit(30);
    results = data;
  }

  const { data: artPosts } = await supabase
    .from("posts")
    .select(baseSelect)
    .eq("status", "published")
    .not("image_path", "is", null)
    .order("created_at", { ascending: false })
    .limit(9);

  return (
    <div className="flex-1 min-w-0">
      <h1 className="font-display font-semibold text-2xl mb-1 text-ink">Explore</h1>
      <p className="text-sm mb-6 text-ink-soft">
        Work and conversations surfacing across every school right now.
      </p>

      {q ? (
        <div>
          <p className="text-xs text-ink-faint mb-3">Results for "{q}"</p>
          <div className="flex flex-col gap-4">
            {results?.map((p) => <PostCard key={p.id} post={p} currentUserId={user?.id} />)}
            {results?.length === 0 && <p className="text-sm text-ink-faint">Nothing matched that search.</p>}
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <p className="font-mono text-[10px] uppercase tracking-widest mb-3 text-ink">Fresh from the studios</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {artPosts?.map((p) => {
                const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/post-media/${p.image_path}`;
                return (
                  <a key={p.id} href={`/post/${p.id}`} className="rounded-md overflow-hidden border border-line block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt="" className="w-full object-cover" style={{ aspectRatio: "4/3" }} />
                    <div className="p-2 bg-card">
                      <p className="text-xs font-medium truncate text-ink">{p.title}</p>
                      <p className="font-mono text-[10px] text-ink-faint">
                        {p.profiles.display_name || p.profiles.username}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
