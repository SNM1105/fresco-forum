"use client";

import { useState } from "react";

export default function OnboardingTutorial() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-orange-50 to-blue-50 border-l-4 border-orange-500 p-6 rounded-lg shadow-md mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-lg font-bold text-ink mb-3">Welcome to Fresco Forum! 👋</h2>
          
          <div className="space-y-3 text-sm text-ink-soft">
            <div className="flex gap-3">
              <span className="text-lg">📝</span>
              <div>
                <strong className="text-ink">Create a post</strong> in the Create section. Art posts go live instantly, political posts are reviewed first.
              </div>
            </div>

            <div className="flex gap-3">
              <span className="text-lg">👍</span>
              <div>
                <strong className="text-ink">Vote on posts</strong> by clicking the ▲ and ▼ buttons. Your votes help surface the best content.
              </div>
            </div>

            <div className="flex gap-3">
              <span className="text-lg">💬</span>
              <div>
                <strong className="text-ink">Click on any post</strong> to view it in detail and add comments. Discuss with other students!
              </div>
            </div>

            <div className="flex gap-3">
              <span className="text-lg">🔍</span>
              <div>
                <strong className="text-ink">Explore</strong> the art grid or search for topics. Filter posts by category in the feed.
              </div>
            </div>

            <div className="flex gap-3">
              <span className="text-lg">📍</span>
              <div>
                <strong className="text-ink">Your profile</strong> shows all your posts and comments. You can delete your own content anytime.
              </div>
            </div>

            <div className="flex gap-3">
              <span className="text-lg">⚠️</span>
              <div>
                <strong className="text-ink">Report content</strong> that breaks community rules. Moderators review all reports.
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="ml-4 text-ink-faint hover:text-ink text-xl font-bold flex-shrink-0"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
