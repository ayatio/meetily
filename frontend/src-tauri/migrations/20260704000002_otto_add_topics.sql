-- Otto Scribe: topic register (ADDENDUM / dossier "wat").
-- Topics discovered per meeting (e.g. #EXCO, #WORKFRONT), later linked to the
-- vault and OttoMap. Populated by the summary/topic pass.
CREATE TABLE IF NOT EXISTS otto_topics (
    id INTEGER PRIMARY KEY,
    meeting_id TEXT NOT NULL,
    topic TEXT NOT NULL,          -- normalized label, no '#'
    first_ts_ms INTEGER,          -- first mention offset in the recording
    created_at TEXT NOT NULL,
    payload TEXT,                 -- json: vault link, ottomap ref, mention count
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_otto_topics_meeting ON otto_topics(meeting_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_otto_topics_unique ON otto_topics(meeting_id, topic);
