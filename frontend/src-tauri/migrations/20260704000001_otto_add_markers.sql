-- Otto Scribe: transcript markers datamodel (ADDENDUM-1 section A).
-- Datamodel only in this phase — no UI. Populated/consumed by later phases:
--   flag / clarify / action  -> user markings during a meeting
--   agent_question           -> the listening agent's own open questions (ADDENDUM-1 B)
-- segment_id NULL means the marker applies to the whole meeting.
CREATE TABLE IF NOT EXISTS otto_markers (
    id INTEGER PRIMARY KEY,
    meeting_id TEXT NOT NULL,
    segment_id TEXT,                        -- NULL = marker on the whole meeting
    type TEXT NOT NULL,                     -- 'flag' | 'clarify' | 'action' | 'agent_question'
    audio_ts_ms INTEGER,                    -- position in the recording
    created_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',    -- 'open' | 'processed' | 'answered' | 'done'
    payload TEXT,                           -- json: citaat, spreker, vraag, antwoord, ottomap_item_id
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_otto_markers_meeting ON otto_markers(meeting_id);
CREATE INDEX IF NOT EXISTS idx_otto_markers_status ON otto_markers(status);
