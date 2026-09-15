const RULES = [
  ["Critique the work, not the person", "Feedback should be specific and useful. Personal attacks get removed regardless of who's right."],
  ["Political posts are reviewed first", "Campus, national and international politics categories are queued for a moderator before they're visible. This isn't censorship of opinion — it's a check against hate speech and brigading."],
  ["Report, don't retaliate", "See something that breaks the rules? Report it. Mods have to give a reason and evidence for any ban or suspension, and you can appeal."],
  ["Original work only", "Post your own art, or credit it clearly if you're sharing someone else's for discussion."],
];

export default function AboutPage() {
  return (
    <div className="flex-1 min-w-0 max-w-2xl">
      <h1 className="font-display font-semibold text-2xl mb-1 text-ink">About &amp; rules</h1>
      <p className="text-sm mb-6 text-ink-soft">
        Screw Your Slop is built and moderated for students, by students. Here's how it stays sharp.
      </p>
      <div className="flex flex-col gap-3 mb-8">
        {RULES.map(([t, d], i) => (
          <div key={t} className="p-4 rounded-md border border-line bg-card">
            <div className="flex items-start gap-3">
              <span className="font-mono text-xs mt-0.5 text-sienna">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="font-semibold text-sm mb-1 text-ink">{t}</h3>
                <p className="text-xs leading-relaxed text-ink-soft">{d}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 rounded-md bg-lapis-tint">
        <p className="text-xs leading-relaxed text-lapis">
          Moderators are students and staff with an admin dashboard covering reports, bans, mutes and post
          approvals. Every enforcement action requires a stated reason and evidence attached.
        </p>
      </div>
    </div>
  );
}
