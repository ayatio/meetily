# Otto Scribe — Decisions & Findings

Running log of decisions and findings per the build brief (`otto-scribe-brief.md`,
engineering rule 3). Newest phase on top. Aliases only, no PII (per global rules).

---

## Phase 1 — build, verify, first vault writer

Branch: `otto/fase-1`. Status: **first version ready to test, awaiting review (D-gate)**.

### 1. Build & run on macOS (aarch64)

Works. The documented `pnpm install && pnpm tauri:dev` is correct, plus two
prerequisites the brief didn't mention:

- **pnpm was not installed.** Enabled via `corepack enable pnpm` (pnpm 11.9.0).
  Toolchain present: cmake 4.3.4, node 22, rustc 1.96, Xcode. Metal is
  auto-selected by `scripts/auto-detect-gpu.js` → `tauri:dev:metal`.
- **The `llama-helper` sidecar must be built before any Rust compile.**
  `tauri.conf.json` declares two `externalBin` sidecars: `binaries/ffmpeg` and
  `binaries/llama-helper`. `ffmpeg` is fetched by `build.rs`; `llama-helper` is
  **not** — its absence makes `cargo build`/`tauri dev` fail with
  `resource path binaries/llama-helper-aarch64-apple-darwin doesn't exist`.
  Build it exactly as CI does (`.github/workflows/build-macos.yml`):
  ```bash
  cargo build --release -p llama-helper --features metal
  cp target/release/llama-helper \
     frontend/src-tauri/binaries/llama-helper-aarch64-apple-darwin
  ```
  Both binaries are gitignored (build artifacts), so this is a per-clone step.
  `llama-helper` is a llama.cpp (`llama-cpp-2`) sidecar used by the summary
  engine, not by transcription.

### 2. Reusing Handy's models — not possible today, don't symlink

Meetily resolves models under the app data dir:
`~/Library/Application Support/com.meetily.ai/models/` (identifier `com.meetily.ai`).
- Whisper: flat GGML `.bin` files (`ggml-<name>.bin`), default `large-v3-turbo`,
  validated by magic bytes; source `huggingface.co/ggerganov/whisper.cpp`.
- Parakeet: NeMo ONNX exports in a per-model subfolder
  `models/parakeet/<model-name>/` (`encoder-model[.int8].onnx`,
  `decoder_joint-model[.int8].onnx`, `nemo128.onnx`, `vocab.txt`).

**Handy's model dir (`~/Library/Application Support/com.pais.handy/models/`) is
currently empty** — nothing downloaded yet. Handy's selected model is
`nemotron-3.5-asr-streaming-0.6b-Q8_0.gguf` (a llama.cpp GGUF ASR model), a
format neither Meetily engine loads. Only a bundled Silero VAD ships inside
`Handy.app`.

**Decision:** do not symlink Meetily's `models/` at Handy's dir. Formats differ
(whisper.cpp GGML / NeMo ONNX vs Handy's GGUF) and Handy has nothing on disk to
reuse. Meetily will download its own models on first use. Revisit only if Ayat
later downloads whisper.cpp GGML models via Handy with matching filenames — in
which case individual-file symlinks into `com.meetily.ai/models/` would work.

### 3. Principle verification (P2 / P3 / P5)

- **P2 (audio always kept) — mostly holds, one caveat.** Audio is saved to
  `~/Movies/meetily-recordings/<meeting>/audio.mp4` (MP4/AAC, 48 kHz mono, not
  WAV), plus 30 s checkpoints during recording. Governed by an `auto_save`
  preference (**default on**). When off, audio chunks are discarded. For Otto,
  P2 requires `auto_save` stays on — flag as a setting to lock down later.
- **P3 (raw transcript never overwritten) — holds.** Raw transcript segments
  live one-row-per-segment in the `transcripts` table (with recording-relative
  `audio_start_time/end_time/duration`). Summaries live in a **separate**
  `summary_processes` table (JSON `result`, plus `result_backup` columns).
  Summarizing cannot touch the raw transcript. There's also a filesystem copy
  per meeting folder (`transcripts.json`). DB: `<app_data>/meeting_minutes.sqlite`.
- **P5 (multilingual per segment NL/FR/EN) — NOT met today.** Language is a
  single global session preference (`LANGUAGE_PREFERENCE`, `lib.rs`), default
  **`auto-translate`** → Whisper auto-detects then **translates everything to
  English** (`set_translate(true)`). No per-segment language tagging, no
  `language` column in the schema. An explicit language locks the whole session.
  Parakeet ignores language entirely. **This is a real gap** that a later phase
  must close (per-chunk detected-language capture + store; drop the forced
  English translation for mixed NL/FR/EN meetings).

### 4. `speaker_embedding` — dead code today

The brief points at `frontend/src-tauri/src/audio/stt.rs`. **That file is
orphaned:** it is not declared as a module anywhere and imports crates that
don't exist in this workspace (`crate::pyannote`, `screenpipe_core`, …). It does
not compile into the app. Inside it, `speaker_embedding: Vec<f32>` is just
copied from a pyannote segment embedding — a leftover screenpipe/legacy
placeholder. **No diarization runs in the shipping app.** The live transcription
path is `audio/transcription/worker.rs` → `whisper_engine/` or
`parakeet_engine/`. The only speaker signal that exists is the coarse `speaker`
column (`'mic'` / `'system'`) on `transcripts`, and even that isn't bound on the
main insert path.

**Implication for Phase 2 speaker→actor:** there is no embedding to cluster on
yet. Diarization/embeddings must be built, not merely "wired up". `stt.rs` can be
mined for reference (it has an `EmbeddingExtractor` over a pyannote ONNX) but is
not a working starting point.

### 5. First vault writer (delivered)

New, self-contained module `frontend/src-tauri/src/otto/vault_writer.rs`
(+ `otto/mod.rs`), registered with two lines in `lib.rs` (minimal upstream diff,
engineering rule 1). Exposes Tauri command:

```
otto_export_meeting_to_vault(meeting_id: String) -> Result<String, String>  // returns written path
```

Behaviour: reads the meeting (`MeetingsRepository::get_meeting`) and its summary
(`SummaryProcessesRepository::get_summary_data`), builds one Markdown note, and
writes it to the vault Inbox (P7). Note layout: YAML frontmatter
(`title`, `date`, `source: otto-scribe`, `meeting_id`, `participants: []`,
`tags`, `exported`), `## Samenvatting` (rendered from the summary JSON, or a
placeholder if none), and `## Raw transcript` (every segment, `[mm:ss]`
prefixed).

Decisions:
- **Destination:** `~/repos/second-brain/Inbox/`, overridable via
  `OTTO_VAULT_INBOX` for testing. Filename `YYYY-MM-DD-<slug>.md`.
- **Never overwrites** (P3): on filename collision it appends `-2`, `-3`, …
- **No git commit from the app.** The writer only drops the file; committing /
  reviewing the vault is Brainiac's job. (Global rule wants vault git discipline,
  but Phase 1 keeps the app side inert to avoid the app touching git.)
- **Trigger:** manual for now (call the command; no auto-export on meeting stop).
  Summary generation is async and finishes after `stop_recording`, so
  auto-export belongs in a later phase once we hook summary completion.
  `participants` is empty because no diarization/identity exists yet (see §4).

Unit tests cover slugify, frontmatter/summary/transcript rendering, and the
no-summary placeholder (`cargo test -p meetily otto::`).

### Open questions for review (D-gate)

1. **P5**: confirm the target — keep detected-language-per-segment and stop
   translating to English? That reshapes the transcription config (Phase 2+).
2. **Vault writer trigger**: keep manual, or auto-export when a meeting's summary
   completes? Auto-export needs a hook into the summary flow (small upstream diff).
3. **Participants/speaker**: acceptable that Phase 1 notes have empty
   participants until diarization exists?
4. **auto_save**: should Otto force `auto_save = true` so P2 can't be disabled?
