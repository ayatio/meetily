//! Live Otto coach agent (S-04 / F-03 rolling pass).
//!
//! Given the live transcript so far, calls the configured LLM (local built-in
//! by default — offline, P6) to produce a rolling grounded summary and a few
//! anticipation questions, each with a `[mm:ss]` source citation (P4: no
//! ungrounded suggestions). The recording view calls this every rolling
//! interval and shows the result live.

use crate::database::repositories::setting::SettingsRepository;
use crate::state::AppState;
use crate::summary::llm_client::{generate_summary, LLMProvider};
use serde::{Deserialize, Serialize};
use tauri::{Manager, Runtime};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoachQuestion {
    pub text: String,
    #[serde(default)]
    pub cite: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CoachResult {
    #[serde(default)]
    pub summary: String,
    #[serde(default)]
    pub questions: Vec<CoachQuestion>,
}

const SYSTEM_PROMPT: &str = r#"Je bent Otto, een live meeting-coach die meeluistert. Je krijgt het transcript-tot-nu-toe (regels met [mm:ss] timestamps).

Geef UITSLUITEND geldige JSON terug, exact dit formaat en niets anders:
{"summary": "<1-2 zinnen rollende samenvatting van waar het gesprek nu staat>",
 "questions": [{"text": "<een korte, scherpe anticipatievraag of verheldering die de gebruiker NU zou moeten overwegen>", "cite": "[mm:ss]"}]}

Regels:
- Maximaal 3 vragen. Liever 1 goede dan 3 zwakke.
- BRONPLICHT: elke vraag heeft een "cite" = een [mm:ss] timestamp die letterlijk in het transcript voorkomt. Verzin niks. Geen bron = laat de vraag weg.
- Vragen anticiperen: wat mist er, wat is dubbelzinnig, welke beslissing of actie dreigt onbesproken te blijven.
- Nederlands, tenzij het gesprek duidelijk in een andere taal is.
- Geen tekst buiten de JSON."#;

fn extract_json(raw: &str) -> Option<String> {
    let start = raw.find('{')?;
    let end = raw.rfind('}')?;
    if end > start {
        Some(raw[start..=end].to_string())
    } else {
        None
    }
}

fn api_key_for(provider: &LLMProvider, s: &crate::database::models::Setting) -> String {
    match provider {
        LLMProvider::Claude => s.anthropic_api_key.clone(),
        LLMProvider::Groq => s.groq_api_key.clone(),
        LLMProvider::OpenAI => s.openai_api_key.clone(),
        LLMProvider::OpenRouter => s.open_router_api_key.clone(),
        LLMProvider::Ollama => s.ollama_api_key.clone(),
        _ => None,
    }
    .unwrap_or_default()
}

/// One rolling coach pass over the given live transcript text.
#[tauri::command]
pub async fn otto_coach_pass<R: Runtime>(
    app: tauri::AppHandle<R>,
    state: tauri::State<'_, AppState>,
    transcript: String,
) -> Result<CoachResult, String> {
    let transcript = transcript.trim();
    // Not enough context yet.
    if transcript.chars().count() < 40 {
        return Ok(CoachResult::default());
    }

    let pool = state.db_manager.pool();
    let setting = SettingsRepository::get_model_config(pool)
        .await
        .map_err(|e| format!("Failed to read model config: {}", e))?
        .ok_or_else(|| "No model configured (open Settings and pick a summary model)".to_string())?;

    let provider = LLMProvider::from_str(&setting.provider)?;
    let api_key = api_key_for(&provider, &setting);
    let app_data_dir = app.path().app_data_dir().ok();

    // Keep the pass cheap: only send the most recent slice of transcript.
    let recent: String = {
        let lines: Vec<&str> = transcript.lines().collect();
        let take = lines.len().min(60);
        lines[lines.len() - take..].join("\n")
    };

    let client = reqwest::Client::new();
    let raw = generate_summary(
        &client,
        &provider,
        &setting.model,
        &api_key,
        SYSTEM_PROMPT,
        &recent,
        setting.ollama_endpoint.as_deref(),
        None,
        Some(600),
        Some(0.3),
        None,
        app_data_dir.as_ref(),
        None,
    )
    .await?;

    // Parse the model output into CoachResult; fall back to raw-as-summary.
    let parsed = extract_json(&raw)
        .and_then(|j| serde_json::from_str::<CoachResult>(&j).ok())
        .unwrap_or_else(|| CoachResult {
            summary: raw.trim().chars().take(400).collect(),
            questions: vec![],
        });

    Ok(parsed)
}
