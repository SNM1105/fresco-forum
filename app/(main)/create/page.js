import { createClient } from "@/lib/supabase/server";
import CreatePostForm from "@/components/CreatePostForm";

export default async function CreatePostPage() {
  const supabase = createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("key, label, category_group, requires_approval")
    .order("sort_order");

  return (
    <div className="flex-1 min-w-0 max-w-2xl">
      <h1 className="font-display font-semibold text-2xl mb-1 text-ink">New post</h1>
      <p className="text-sm mb-6 text-ink-soft">
        Say what you actually think. Attribute your sources, tag your school if it's relevant.
      </p>
      <CreatePostForm categories={categories || []} />
    </div>
  );
}
