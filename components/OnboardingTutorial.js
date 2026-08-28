"use client";

import { useState, useEffect } from "react";

export default function OnboardingTutorial() {
  const [dismissed, setDismissed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check localStorage to see if tutorial was dismissed
    const wasDismissed = localStorage.getItem("fresco-tutorial-dismissed");
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("fresco-tutorial-dismissed", "true");
  };

  if (!mounted) return null;

  // Show as help button after dismissed
  if (dismissed && !showHelp) {
    return (
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-4 right-4 w-12 h-12 rounded-full bg-orange-500 text-white shadow-lg hover:bg-orange-600 flex items-center justify-center text-xl font-bold z-50"
        title="Show help"
      >
        ?
      </button>
    );
  }

  // Show help modal
  if (dismissed && showHelp) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-ink">Help</h2>
            <button
              onClick={() => setShowHelp(false)}
              className="text-ink-faint hover:text-ink text-xl font-bold"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

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
      </div>
    );
  }

  // Show full tutorial on first visit
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
          onClick={handleDismiss}
          className="ml-4 text-ink-faint hover:text-ink text-xl font-bold flex-shrink-0"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
