CREATE TABLE IF NOT EXISTS wb_skill_reviews (
  account_id TEXT NOT NULL REFERENCES wb_accounts(id),
  lesson_id TEXT NOT NULL REFERENCES wb_lessons(id),
  skill TEXT NOT NULL CHECK(skill IN ('grammar','listening','speaking','reading','writing')),
  remembered INTEGER NOT NULL CHECK(remembered IN (0,1)),
  response_text TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(account_id, lesson_id, skill)
);

CREATE TABLE IF NOT EXISTS wb_lesson_notes (
            id TEXT PRIMARY KEY,
            account_id TEXT NOT NULL,
            lesson_slug TEXT NOT NULL,
            note_content TEXT NOT NULL DEFAULT '',
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(account_id, lesson_slug)
          );
