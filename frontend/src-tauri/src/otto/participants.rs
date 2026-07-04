//! Meeting participants (Stage A — meeting-level selection).
//!
//! Lets the user attach participant names to a meeting. Sources today: free
//! text plus "remembered" names (distinct names used on previous meetings, for
//! autocomplete). The vault has no structured actor registry yet, so
//! vault-actor sync layers on here later without changing this storage.
//!
//! This is NOT diarisation (per-speaker attribution) — that is a separate piece
//! that assigns a `speaker` to each transcript segment. These names describe who
//! was in the meeting, and land in the exported note's `participants` frontmatter.

use crate::state::AppState;
use chrono::Utc;
use sqlx::SqlitePool;
use tracing::info;

/// Normalise a raw name list: trim, drop empties, de-duplicate case-insensitively
/// while preserving the first-seen spelling and order.
fn clean_names(raw: Vec<String>) -> Vec<String> {
    let mut seen: Vec<String> = Vec::new();
    let mut lower_seen: Vec<String> = Vec::new();
    for name in raw {
        let trimmed = name.trim();
        if trimmed.is_empty() {
            continue;
        }
        let lower = trimmed.to_lowercase();
        if lower_seen.contains(&lower) {
            continue;
        }
        lower_seen.push(lower);
        seen.push(trimmed.to_string());
    }
    seen
}

/// Load the participant names stored for a meeting (empty if none). Reusable by
/// the vault writer.
pub async fn load_participants(pool: &SqlitePool, meeting_id: &str) -> Vec<String> {
    let row: Option<(String,)> =
        sqlx::query_as("SELECT participants_json FROM otto_meeting_participants WHERE meeting_id = ?")
            .bind(meeting_id)
            .fetch_optional(pool)
            .await
            .ok()
            .flatten();
    match row {
        Some((json,)) => serde_json::from_str::<Vec<String>>(&json).unwrap_or_default(),
        None => Vec::new(),
    }
}

/// Store (replace) the participant list for a meeting.
#[tauri::command]
pub async fn otto_set_meeting_participants(
    state: tauri::State<'_, AppState>,
    meeting_id: String,
    participants: Vec<String>,
) -> Result<Vec<String>, String> {
    let meeting_id = meeting_id.trim().to_string();
    if meeting_id.is_empty() {
        return Err("meeting_id is empty".to_string());
    }
    let names = clean_names(participants);
    let json = serde_json::to_string(&names).map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();

    let pool = state.db_manager.pool();
    sqlx::query(
        "INSERT INTO otto_meeting_participants (meeting_id, participants_json, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(meeting_id) DO UPDATE SET participants_json = excluded.participants_json, updated_at = excluded.updated_at",
    )
    .bind(&meeting_id)
    .bind(&json)
    .bind(&now)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to save participants for {}: {}", meeting_id, e))?;

    info!("otto: saved {} participant(s) for {}", names.len(), meeting_id);
    Ok(names)
}

/// Get the participant list for a meeting.
#[tauri::command]
pub async fn otto_get_meeting_participants(
    state: tauri::State<'_, AppState>,
    meeting_id: String,
) -> Result<Vec<String>, String> {
    let meeting_id = meeting_id.trim().to_string();
    if meeting_id.is_empty() {
        return Err("meeting_id is empty".to_string());
    }
    Ok(load_participants(state.db_manager.pool(), &meeting_id).await)
}

/// List distinct participant names used across all meetings (autocomplete
/// suggestions). Ordered by most recently used first.
#[tauri::command]
pub async fn otto_list_known_participants(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<String>, String> {
    let pool = state.db_manager.pool();
    let rows: Vec<(String,)> = sqlx::query_as(
        "SELECT participants_json FROM otto_meeting_participants ORDER BY updated_at DESC",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list known participants: {}", e))?;

    let mut all: Vec<String> = Vec::new();
    for (json,) in rows {
        if let Ok(names) = serde_json::from_str::<Vec<String>>(&json) {
            all.extend(names);
        }
    }
    Ok(clean_names(all))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn clean_names_trims_dedupes_and_keeps_order() {
        let input = vec![
            "  Ayat ".to_string(),
            "Caroline".to_string(),
            "".to_string(),
            "ayat".to_string(), // dup, case-insensitive
            "Michel".to_string(),
        ];
        assert_eq!(clean_names(input), vec!["Ayat", "Caroline", "Michel"]);
    }
}
