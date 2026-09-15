import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "./ui";
import SignOutButton from "./SignOutButton";

export default async function Nav() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url, program")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <header className="sticky top-0 z-30 bg-plaster border-b border-line">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link href="/feed" className="font-display font-semibold text-xl text-ink">
          Fresco <span className="text-sienna">Forum</span>
        </Link>

        <form action="/explore" className="hidden md:flex items-center flex-1 max-w-md mx-2">
          <input
            name="q"
            placeholder="Search posts, schools, clubs, categories…"
            className="w-full px-3 py-1.5 rounded-full text-sm bg-card border border-line outline-none"
          />
        </form>

        <nav className="flex items-center gap-1 ml-auto text-sm">
          <Link href="/feed" className="px-3 py-1.5 rounded-full text-ink-soft hover:bg-card">Home</Link>
          <Link href="/explore" className="px-3 py-1.5 rounded-full text-ink-soft hover:bg-card">Explore</Link>
          <Link href="/create" className="px-3 py-1.5 rounded-full text-ink-soft hover:bg-card">Post</Link>

          {profile ? (
            <>
              <Link href={`/profile/${profile.username}`}>
                <Avatar name={profile.display_name || profile.username} url={profile.avatar_url} program={profile.program} size={30} />
              </Link>
              <SignOutButton />
            </>
          ) : (
            <Link href="/login" className="px-3 py-1.5 rounded-full bg-ink text-plaster">Log in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
