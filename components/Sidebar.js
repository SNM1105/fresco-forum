import { createClient } from "@/lib/supabase/server";

const GROUP_LABEL = { art: "Art", politics: "Politics", life: "Student Life" };
const GROUP_COLOR = { art: "text-sienna", politics: "text-lapis", life: "text-verdigris" };

export default async function Sidebar() {
  const supabase = createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("key, label, category_group")
    .order("sort_order");

  const groups = ["art", "politics", "life"].map((g) => ({
    key: g,
    items: (categories || []).filter((c) => c.category_group === g),
  }));

  return (
    <aside className="hidden lg:block w-56 flex-shrink-0">
      {groups.map((g) => (
        <div key={g.key} className="mb-5">
          <div className={`font-mono text-[10px] uppercase tracking-widest mb-2 pb-1 border-b border-line ${GROUP_COLOR[g.key]}`}>
            {GROUP_LABEL[g.key]}
          </div>
          <div className="flex flex-col gap-0.5">
            {g.items.map((c) => (
              <a
                key={c.key}
                href={`/feed?category=${c.key}`}
                className="px-2 py-1.5 rounded text-sm text-ink-soft hover:bg-card"
              >
                {c.label}
              </a>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
