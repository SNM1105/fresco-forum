"use client";

import { useState, useTransition } from "react";
import { moderatePost } from "@/lib/actions/moderation";

export default function ModQueue({ pendingPosts, openReports }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  const act = (postId, action) => {
    const reason = window.prompt(
      action === "approve_post" ? "Reason for approving (10+ chars):" : "Reason for removing (10+ chars):"
    );
    if (!reason) return;
    setError(null);
    startTransition(async () => {
      const result = await moderatePost({ postId, action, reason, path: "/admin" });
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="flex flex-col gap-8">
      {error && <p className="text-sm text-sienna-deep">{error}</p>}

      <section>
        <h2 className="font-mono text-[10px] uppercase tracking-widest mb-3 text-ink">
          Pending review ({pendingPosts.length})
        </h2>
        <div className="flex flex-col gap-2">
          {pendingPosts.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-md border border-line bg-card">
              <div>
                <p className="text-sm font-medium text-ink">{p.title}</p>
                <p className="text-xs text-ink-faint">{p.category_key} · {p.profiles?.username}</p>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={pending}
                  onClick={() => act(p.id, "approve_post")}
                  className="text-xs px-3 py-1.5 rounded-full bg-verdigris text-white"
                >
                  Approve
                </button>
                <button
                  disabled={pending}
                  onClick={() => act(p.id, "delete_post")}
                  className="text-xs px-3 py-1.5 rounded-full bg-sienna text-white"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {pendingPosts.length === 0 && <p className="text-sm text-ink-faint">Queue's empty.</p>}
        </div>
      </section>

      <section>
        <h2 className="font-mono text-[10px] uppercase tracking-widest mb-3 text-ink">
          Open reports ({openReports.length})
        </h2>
        <div className="flex flex-col gap-2">
          {openReports.map((r) => (
            <div key={r.id} className="p-3 rounded-md border border-line bg-card">
              <p className="text-xs text-ink-faint">
                {r.target_type} reported by {r.profiles?.username}
              </p>
              <p className="text-sm text-ink mt-1">{r.reason}</p>
            </div>
          ))}
          {openReports.length === 0 && <p className="text-sm text-ink-faint">No open reports.</p>}
        </div>
      </section>
    </div>
  );
}
