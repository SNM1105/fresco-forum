import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";
import OnboardingTutorial from "@/components/OnboardingTutorial";

const SORTS = {
  new: { column: "created_at", ascending: false },
  popular: { column: "vote_score", ascending: false },
  discussed: { column: "comment_count", ascending: false },
};

export default async function FeedPage({ searchParams }) {
  const supabase = createClient();
  const sortKey = SORTS[searchParams?.sort] ? searchParams.sort : "new";
  const category = searchParams?.category;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("posts")
    .select(
      `id, title, body, image_path, status, vote_score, comment_count, created_at,
       categories ( key, label, category_group ),
       profiles ( username, display_name, avatar_url, school )`
    )
    .eq("status", "published")
    .order(SORTS[sortKey].column, { ascending: SORTS[sortKey].ascending })
    .limit(30);

  if (category) query = query.eq("category_key", category);

  const { data: posts, error } = await query;

  // Pull the current user's votes for these posts in one query, so
  // PostCard can render the right arrow highlighted without an
  // extra round trip per card.
  let voteMap = {};
  if (user && posts?.length) {
    const { data: votes } = await supabase
      .from("votes")
      .select("target_id, value")
      .eq("user_id", user.id)
      .eq("target_type", "post")
      .in("target_id", posts.map((p) => p.id));
    voteMap = Object.fromEntries((votes || []).map((v) => [v.target_id, v.value]));
  }

  return (
    <div className="flex-1 min-w-0 max-w-2xl">
      <OnboardingTutorial />
      
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {Object.keys(SORTS).map((s) => (
          <a
            key={s}
            href={`/feed?sort=${s}${category ? `&category=${category}` : ""}`}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border whitespace-nowrap ${
              sortKey === s ? "bg-ink text-plaster border-ink" : "border-line text-ink-soft"
            }`}
          >
            {s === "new" ? "New" : s === "popular" ? "Popular" : "Most Discussed"}
          </a>
        ))}
      </div>

      {error && <p className="text-sm text-sienna-deep">Couldn't load the feed: {error.message}</p>}

      <div className="flex flex-col gap-4">
        {posts?.map((post) => (
          <PostCard key={post.id} post={post} currentUserVote={voteMap[post.id] || 0} currentUserId={user?.id} />
        ))}
        {posts?.length === 0 && (
          <p className="text-sm text-ink-faint py-12 text-center">
            Nothing here yet — be the first to post in this category.
          </p>
        )}
      </div>
    </div>
  );
}
