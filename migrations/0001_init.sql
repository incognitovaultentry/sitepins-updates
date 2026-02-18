-- D1 schema for sitepins-updates

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  details TEXT,
  type TEXT NOT NULL DEFAULT 'Other',
  status TEXT NOT NULL DEFAULT 'open',
  upvotes INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback (status);
CREATE INDEX IF NOT EXISTS idx_feedback_upvotes ON feedback (upvotes DESC);

-- Seed some example feedback
INSERT INTO feedback (title, details, type, status, upvotes, created_at) VALUES
  ('Dark mode for the editor', 'Would love a dark theme option in the content editor', 'Feature Request', 'planned', 14, '2026-02-01T10:00:00.000Z'),
  ('Support for custom fields', 'Ability to define custom field types beyond text/image/rich text', 'Feature Request', 'building', 22, '2026-02-05T09:00:00.000Z'),
  ('Media library search is slow', 'Searching in the media library takes 3-4 seconds on large collections', 'Bug', 'open', 8, '2026-02-10T14:00:00.000Z'),
  ('Bulk publish improvements', 'Allow selecting multiple drafts and publishing them at once', 'Improvement', 'open', 6, '2026-02-12T11:00:00.000Z'),
  ('GitHub Actions integration', 'Trigger builds automatically when content is published', 'Feature Request', 'completed', 31, '2026-01-20T08:00:00.000Z');
