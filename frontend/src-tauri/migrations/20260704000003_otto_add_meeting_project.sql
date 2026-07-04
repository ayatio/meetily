-- Otto Scribe: the designated project for a meeting.
-- Selected up-front; routes the vault note into that project and (later) the
-- meeting's action-items into that project's OttoMap board.
CREATE TABLE IF NOT EXISTS otto_meeting_project (
    meeting_id TEXT PRIMARY KEY NOT NULL,
    project TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);
