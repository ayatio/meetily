//! Project selection (the linchpin): choose a project up-front so the meeting's
//! note lands in the right Obsidian project and its action-items route to that
//! project's OttoMap board.
//!
//! Projects are the folders under the vault `Projects/` directory
//! (`~/repos/second-brain/Projects/<Name>`), overridable via `OTTO_VAULT_PROJECTS`.

use crate::state::AppState;
use chrono::Utc;
use std::path::PathBuf;
use tracing::info;

/// Resolve the vault `Projects/` directory.
pub fn vault_projects_dir() -> Result<PathBuf, String> {
    if let Ok(dir) = std::env::var("OTTO_VAULT_PROJECTS") {
        if !dir.trim().is_empty() {
            return Ok(PathBuf::from(dir));
        }
    }
    let home = std::env::var("HOME").map_err(|_| "HOME env var not set".to_string())?;
    Ok(PathBuf::from(home)
        .join("repos")
        .join("second-brain")
        .join("Projects"))
}

/// List the available projects (subfolders of the vault `Projects/` dir),
/// sorted alphabetically. Hidden folders (dot-prefixed) are ignored.
#[tauri::command]
pub async fn otto_list_projects() -> Result<Vec<String>, String> {
    let dir = vault_projects_dir()?;
    let mut names: Vec<String> = Vec::new();
    let entries = match std::fs::read_dir(&dir) {
        Ok(e) => e,
        Err(_) => return Ok(names), // no Projects dir yet -> empty list
    };
    for entry in entries.flatten() {
        if entry.file_type().map(|t| t.is_dir()).unwrap_or(false) {
            if let Some(name) = entry.file_name().to_str() {
                if !name.starts_with('.') {
                    names.push(name.to_string());
                }
            }
        }
    }
    names.sort();
    Ok(names)
}

/// Store the chosen project for a meeting.
#[tauri::command]
pub async fn otto_set_meeting_project(
    state: tauri::State<'_, AppState>,
    meeting_id: String,
    project: String,
) -> Result<String, String> {
    let meeting_id = meeting_id.trim().to_string();
    let project = project.trim().to_string();
    if meeting_id.is_empty() {
        return Err("meeting_id is empty".to_string());
    }
    let now = Utc::now().to_rfc3339();
    let pool = state.db_manager.pool();

    if project.is_empty() {
        sqlx::query("DELETE FROM otto_meeting_project WHERE meeting_id = ?")
            .bind(&meeting_id)
            .execute(pool)
            .await
            .map_err(|e| e.to_string())?;
        return Ok(String::new());
    }

    sqlx::query(
        "INSERT INTO otto_meeting_project (meeting_id, project, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(meeting_id) DO UPDATE SET project = excluded.project, updated_at = excluded.updated_at",
    )
    .bind(&meeting_id)
    .bind(&project)
    .bind(&now)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to save project for {}: {}", meeting_id, e))?;

    info!("otto: meeting {} assigned to project {}", meeting_id, project);
    Ok(project)
}

/// Get the chosen project for a meeting (empty string if none). Reusable by the
/// vault writer.
pub async fn load_meeting_project(pool: &sqlx::SqlitePool, meeting_id: &str) -> Option<String> {
    let row: Option<(String,)> =
        sqlx::query_as("SELECT project FROM otto_meeting_project WHERE meeting_id = ?")
            .bind(meeting_id)
            .fetch_optional(pool)
            .await
            .ok()
            .flatten();
    row.map(|(p,)| p)
}

#[tauri::command]
pub async fn otto_get_meeting_project(
    state: tauri::State<'_, AppState>,
    meeting_id: String,
) -> Result<String, String> {
    Ok(load_meeting_project(state.db_manager.pool(), meeting_id.trim())
        .await
        .unwrap_or_default())
}
