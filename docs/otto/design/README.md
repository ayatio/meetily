# Otto Scribe — design reference

Ayat's UI mockups live here as PNGs (see ADDENDUM-1 section C). When present,
**these files are the authoritative UI reference** — the Otto UI follows them.

Expected mockups:

- `01-live-transcript.png` — live view: LIVE badge + timer, realtime transcript
  with speaker + role-tag + timestamps, coach-suggestion card with source
  timestamp, "Stop & Sync to Vault".
- `02-vault-detail.png` — meeting detail after sync: vault status ("Sent to
  Inbox/"), "View in Obsidian", frontmatter card (date, title, participants),
  grounded summary with citation + timestamp per bullet.
- `03-raw-transcript.png` — raw transcript view (P3) under the summary,
  auto-scroll toggle, tab bar Coach / Vault / Meetings / Settings.

Style: dark theme, purple accent, monospace for transcript and citations,
suggestions always with a source reference.

> Until the PNGs land, the current Otto UI (`components/Otto/OttoMeetingBar.tsx`)
> uses the existing light Meetily style as a functional placeholder. A first-pass
> proposal of the dark/purple/monospace direction has been shared separately.
