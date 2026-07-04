//! Vault writer — the first Otto piece (Phase 1).
//!
//! After a meeting, export a single Markdown note into the Obsidian vault's
//! `Inbox/` folder (principle P7: everything ends in the vault, write only to
//! `Inbox/`, review via Brainiac). The note carries frontmatter, the full raw
//! transcript (P3: never overwritten) and the summary if one exists.
//!
//! Phase 1 is intentionally minimal: a single note per finished meeting, no
//! rolling processing, no git commit (Brainiac owns vault review). The writer
//! is exposed as the Tauri command `otto_export_meeting_to_vault`.

use crate::api::{MeetingDetails, MeetingTranscript};
use crate::database::repositories::{meeting::MeetingsRepository, summary::SummaryProcessesRepository};
use crate::state::AppState;
use serde_json::Value;
use std::path::PathBuf;
use tracing::{info, warn};

/// Resolve the vault `Inbox/` directory.
///
/// Defaults to `~/repos/second-brain/Inbox`. Overridable with the
/// `OTTO_VAULT_INBOX` env var (full path to the Inbox dir) so the destination
/// can be redirected in tests or on other machines without a rebuild.
pub fn vault_inbox_dir() -> Result<PathBuf, String> {
    if let Ok(dir) = std::env::var("OTTO_VAULT_INBOX") {
        if !dir.trim().is_empty() {
            return Ok(PathBuf::from(dir));
        }
    }
    let home = std::env::var("HOME").map_err(|_| "HOME env var not set".to_string())?;
    Ok(PathBuf::from(home)
        .join("repos")
        .join("second-brain")
        .join("Inbox"))
}

/// Turn a meeting title into a filesystem-safe slug.
fn slugify(title: &str) -> String {
    let mut slug: String = title
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() {
                c.to_ascii_lowercase()
            } else {
                '-'
            }
        })
        .collect();
    // Collapse runs of '-' and trim them.
    while slug.contains("--") {
        slug = slug.replace("--", "-");
    }
    let slug = slug.trim_matches('-').to_string();
    if slug.is_empty() {
        "meeting".to_string()
    } else {
        slug.chars().take(60).collect()
    }
}

/// Render the summary JSON (Meetily stores an LLM structured object) as
/// readable Markdown. Falls back to a fenced JSON block for shapes we don't
/// recognise, so nothing is ever silently dropped.
fn render_summary(value: &Value) -> String {
    let mut out = String::new();
    render_value(value, 3, &mut out);
    let rendered = out.trim();
    if rendered.is_empty() {
        format!("```json\n{}\n```", serde_json::to_string_pretty(value).unwrap_or_default())
    } else {
        rendered.to_string()
    }
}

fn render_value(value: &Value, heading_level: usize, out: &mut String) {
    match value {
        Value::Object(map) => {
            for (key, val) in map {
                let title = humanize_key(key);
                match val {
                    Value::String(s) if !s.trim().is_empty() => {
                        out.push_str(&format!("{} {}\n\n{}\n\n", "#".repeat(heading_level.min(6)), title, s.trim()));
                    }
                    Value::Array(items) if !items.is_empty() => {
                        out.push_str(&format!("{} {}\n\n", "#".repeat(heading_level.min(6)), title));
                        render_array(items, out);
                        out.push('\n');
                    }
                    Value::Object(_) => {
                        out.push_str(&format!("{} {}\n\n", "#".repeat(heading_level.min(6)), title));
                        render_value(val, heading_level + 1, out);
                    }
                    _ => {}
                }
            }
        }
        Value::Array(items) => render_array(items, out),
        Value::String(s) => out.push_str(&format!("{}\n\n", s.trim())),
        _ => {}
    }
}

fn render_array(items: &[Value], out: &mut String) {
    for item in items {
        match item {
            Value::String(s) if !s.trim().is_empty() => out.push_str(&format!("- {}\n", s.trim())),
            Value::Object(map) => {
                // Common shape: {"title": "...", "content": "..."} or bullet-like objects.
                if let Some(text) = map.get("content").or_else(|| map.get("text")).and_then(Value::as_str) {
                    let prefix = map.get("title").and_then(Value::as_str);
                    match prefix {
                        Some(t) => out.push_str(&format!("- **{}**: {}\n", t.trim(), text.trim())),
                        None => out.push_str(&format!("- {}\n", text.trim())),
                    }
                } else {
                    let mut inner = String::new();
                    render_value(item, 4, &mut inner);
                    out.push_str(inner.trim());
                    out.push('\n');
                }
            }
            _ => {}
        }
    }
}

fn humanize_key(key: &str) -> String {
    let spaced = key.replace(['_', '-'], " ");
    let mut chars = spaced.chars();
    match chars.next() {
        Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
        None => spaced,
    }
}

/// Format a recording-relative offset (seconds) as `[mm:ss]`.
fn format_offset(seconds: f64) -> String {
    let total = seconds.max(0.0) as u64;
    format!("[{:02}:{:02}]", total / 60, total % 60)
}

/// Build the raw transcript body from the meeting's segments (P3).
fn render_transcript(transcripts: &[MeetingTranscript]) -> String {
    if transcripts.is_empty() {
        return "_Geen transcript segmenten opgeslagen._".to_string();
    }
    let mut out = String::new();
    for t in transcripts {
        let text = t.text.trim();
        if text.is_empty() {
            continue;
        }
        match t.audio_start_time {
            Some(start) => out.push_str(&format!("{} {}\n", format_offset(start), text)),
            None => out.push_str(&format!("{}\n", text)),
        }
    }
    if out.trim().is_empty() {
        "_Geen transcript segmenten opgeslagen._".to_string()
    } else {
        out.trim_end().to_string()
    }
}

/// Assemble the complete Markdown note (frontmatter + summary + raw transcript).
///
/// Pure function so it can be unit-tested without a database or filesystem.
pub fn build_note_markdown(
    meeting: &MeetingDetails,
    summary: Option<&Value>,
    exported_at: &str,
) -> String {
    let date = meeting.created_at.split('T').next().unwrap_or(&meeting.created_at);

    let summary_md = match summary {
        Some(v) => render_summary(v),
        None => "_Nog geen samenvatting beschikbaar._".to_string(),
    };
    let transcript_md = render_transcript(&meeting.transcripts);

    // YAML frontmatter. Title is quoted to survive colons/special chars.
    let safe_title = meeting.title.replace('"', "'");
    format!(
        "---\n\
title: \"{title}\"\n\
date: {date}\n\
source: otto-scribe\n\
type: meeting-transcript\n\
meeting_id: {id}\n\
participants: []\n\
tags: [otto-scribe, meeting, inbox]\n\
exported: {exported}\n\
---\n\
\n\
# {title}\n\
\n\
## Samenvatting\n\
\n\
{summary}\n\
\n\
## Raw transcript\n\
\n\
{transcript}\n",
        title = safe_title,
        date = date,
        id = meeting.id,
        exported = exported_at,
        summary = summary_md,
        transcript = transcript_md,
    )
}

/// Write `content` to `Inbox/<filename>`, never overwriting an existing note
/// (appends `-2`, `-3`, ... on collision — P3, nothing is overwritten).
fn write_unique(inbox: &PathBuf, base_name: &str, content: &str) -> Result<PathBuf, String> {
    std::fs::create_dir_all(inbox)
        .map_err(|e| format!("Failed to create vault Inbox dir {}: {}", inbox.display(), e))?;

    let mut candidate = inbox.join(format!("{}.md", base_name));
    let mut n = 2;
    while candidate.exists() {
        candidate = inbox.join(format!("{}-{}.md", base_name, n));
        n += 1;
    }
    std::fs::write(&candidate, content)
        .map_err(|e| format!("Failed to write vault note {}: {}", candidate.display(), e))?;
    Ok(candidate)
}

/// Export a finished meeting to the vault `Inbox/`. Returns the written path.
#[tauri::command]
pub async fn otto_export_meeting_to_vault(
    state: tauri::State<'_, AppState>,
    meeting_id: String,
) -> Result<String, String> {
    let meeting_id = meeting_id.trim().to_string();
    if meeting_id.is_empty() {
        return Err("meeting_id is empty".to_string());
    }
    info!("otto: exporting meeting {} to vault", meeting_id);

    let pool = state.db_manager.pool();

    let meeting: MeetingDetails = MeetingsRepository::get_meeting(pool, &meeting_id)
        .await
        .map_err(|e| format!("Failed to load meeting {}: {}", meeting_id, e))?
        .ok_or_else(|| format!("Meeting {} not found", meeting_id))?;

    // Summary is optional; a missing/failed summary must not block the export.
    let summary_value: Option<Value> = match SummaryProcessesRepository::get_summary_data(pool, &meeting_id).await {
        Ok(Some(process)) => process.result.and_then(|r| match serde_json::from_str::<Value>(&r) {
            Ok(v) => Some(v),
            Err(e) => {
                warn!("otto: summary JSON for {} did not parse: {}", meeting_id, e);
                None
            }
        }),
        Ok(None) => None,
        Err(e) => {
            warn!("otto: could not load summary for {}: {}", meeting_id, e);
            None
        }
    };

    let exported_at = chrono::Utc::now().to_rfc3339();
    let content = build_note_markdown(&meeting, summary_value.as_ref(), &exported_at);

    let date = meeting.created_at.split('T').next().unwrap_or("undated");
    let base_name = format!("{}-{}", date, slugify(&meeting.title));

    let inbox = vault_inbox_dir()?;
    let path = write_unique(&inbox, &base_name, &content)?;

    info!("otto: wrote vault note {}", path.display());
    Ok(path.to_string_lossy().to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::api::{MeetingDetails, MeetingTranscript};

    fn sample_meeting() -> MeetingDetails {
        MeetingDetails {
            id: "abc123".to_string(),
            title: "Team Standup: Q3".to_string(),
            created_at: "2026-07-04T09:30:00+00:00".to_string(),
            updated_at: "2026-07-04T10:00:00+00:00".to_string(),
            transcripts: vec![
                MeetingTranscript {
                    id: "t1".to_string(),
                    text: "Goedemorgen allemaal.".to_string(),
                    timestamp: "2026-07-04T09:30:01Z".to_string(),
                    audio_start_time: Some(1.0),
                    audio_end_time: Some(3.0),
                    duration: Some(2.0),
                },
                MeetingTranscript {
                    id: "t2".to_string(),
                    text: "Let's discuss the roadmap.".to_string(),
                    timestamp: "2026-07-04T09:30:05Z".to_string(),
                    audio_start_time: Some(65.0),
                    audio_end_time: Some(68.0),
                    duration: Some(3.0),
                },
            ],
        }
    }

    #[test]
    fn slugify_is_filesystem_safe() {
        assert_eq!(slugify("Team Standup: Q3"), "team-standup-q3");
        assert_eq!(slugify("  ***  "), "meeting");
    }

    #[test]
    fn note_has_frontmatter_summary_and_transcript() {
        let m = sample_meeting();
        let summary = serde_json::json!({
            "overview": "Korte sync over de roadmap.",
            "action_items": ["Ayat stuurt de planning", "Team reviewt Brainiac"]
        });
        let md = build_note_markdown(&m, Some(&summary), "2026-07-04T10:05:00+00:00");

        assert!(md.starts_with("---\n"));
        assert!(md.contains("title: \"Team Standup: Q3\""));
        assert!(md.contains("date: 2026-07-04"));
        assert!(md.contains("meeting_id: abc123"));
        assert!(md.contains("## Samenvatting"));
        assert!(md.contains("Korte sync over de roadmap."));
        assert!(md.contains("- Ayat stuurt de planning"));
        assert!(md.contains("## Raw transcript"));
        assert!(md.contains("[00:01] Goedemorgen allemaal."));
        assert!(md.contains("[01:05] Let's discuss the roadmap."));
    }

    #[test]
    fn note_without_summary_has_placeholder() {
        let m = sample_meeting();
        let md = build_note_markdown(&m, None, "2026-07-04T10:05:00+00:00");
        assert!(md.contains("_Nog geen samenvatting beschikbaar._"));
    }

    #[test]
    fn write_unique_never_overwrites() {
        let dir = std::env::temp_dir().join(format!("otto-vault-test-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);

        let p1 = write_unique(&dir, "2026-07-04-standup", "one").unwrap();
        let p2 = write_unique(&dir, "2026-07-04-standup", "two").unwrap();
        let p3 = write_unique(&dir, "2026-07-04-standup", "three").unwrap();

        assert_eq!(p1.file_name().unwrap(), "2026-07-04-standup.md");
        assert_eq!(p2.file_name().unwrap(), "2026-07-04-standup-2.md");
        assert_eq!(p3.file_name().unwrap(), "2026-07-04-standup-3.md");
        assert_eq!(std::fs::read_to_string(&p1).unwrap(), "one");
        assert_eq!(std::fs::read_to_string(&p2).unwrap(), "two");

        std::fs::remove_dir_all(&dir).unwrap();
    }

    /// End-to-end smoke test against the REAL local Meetily DB. Ignored by
    /// default (environment-coupled). Run manually to verify the full command
    /// path — DB read → render → write — on real data:
    ///   cargo test --features metal otto::vault_writer::tests::export_real_meeting_smoke -- --ignored --nocapture
    /// Override the DB with OTTO_TEST_DB=/path/to/meeting_minutes.sqlite.
    #[test]
    #[ignore]
    fn export_real_meeting_smoke() {
        let db = std::env::var("OTTO_TEST_DB").unwrap_or_else(|_| {
            format!(
                "{}/Library/Application Support/com.meetily.ai/meeting_minutes.sqlite",
                std::env::var("HOME").unwrap()
            )
        });
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            let pool = sqlx::SqlitePool::connect(&format!("sqlite:{}?mode=ro", db))
                .await
                .expect("open real db read-only");

            let (id,): (String,) =
                sqlx::query_as("SELECT id FROM meetings ORDER BY created_at DESC LIMIT 1")
                    .fetch_one(&pool)
                    .await
                    .expect("at least one meeting in the DB");

            let meeting = MeetingsRepository::get_meeting(&pool, &id)
                .await
                .unwrap()
                .expect("meeting loads");
            let summary = SummaryProcessesRepository::get_summary_data(&pool, &id)
                .await
                .unwrap()
                .and_then(|p| p.result)
                .and_then(|r| serde_json::from_str::<Value>(&r).ok());

            let md = build_note_markdown(&meeting, summary.as_ref(), "2026-07-04T00:00:00+00:00");

            let dir = std::env::temp_dir().join("otto-real-smoke");
            let _ = std::fs::remove_dir_all(&dir);
            let path = write_unique(&dir, &slugify(&meeting.title), &md).unwrap();
            let written = std::fs::read_to_string(&path).unwrap();

            assert!(written.starts_with("---\n"));
            assert!(written.contains("## Raw transcript"));
            assert!(written.contains(&format!("meeting_id: {}", meeting.id)));
            println!("\n=== WROTE {} ===\n{}", path.display(), written);
        });
    }
}
