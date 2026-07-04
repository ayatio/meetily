-- Otto Scribe: store selectable meeting participants (Stage A, meeting-level).
-- Names are user-selected (free text + remembered names for now; vault-actor
-- sync layers on later). Speaker-level attribution (diarisation) is separate.
CREATE TABLE IF NOT EXISTS otto_meeting_participants (
    meeting_id TEXT PRIMARY KEY NOT NULL,
    participants_json TEXT NOT NULL,  -- JSON array of participant names
    updated_at TEXT NOT NULL,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);
