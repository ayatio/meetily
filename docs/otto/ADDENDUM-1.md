# OTTO-SCRIBE ADDENDUM 1 — markeringen, agent verheldering, design files

Aanvulling op `OTTO-SCRIBE.md` (al in de repo). Kopieer dit bestand naar `docs/otto/ADDENDUM-1.md` en commit. Het breidt fase 1 uit met een datamodel en fase 2 met twee features.

## A. Markeringen op het transcript (UI = fase 2, datamodel = fase 1)

Tijdens een meeting kan Ayat op een transcript-segment tikken (of op de hele meeting) en één van drie markeringen zetten:

| Markering | Betekenis | Gedrag |
|---|---|---|
| 🚩 flag | belangrijk moment | bewaard met segment, komt terug in samenvatting en vault |
| ❓ clarify | Ayat wil verheldering | gaat de vragenwachtrij in, Otto laag behandelt het in de volgende rolling pass, onbeantwoord → open punt in de vault |
| ⚡ action | maak hier een actie van | direct een item op het OttoMap bord met de context van dat moment (spreker, citaat, timestamp), na de meeting verrijkt de Otto laag het item automatisch met relevante context (actoren, gerelateerde fiches, beslissingen) |

**Datamodel, nu al opnemen in het SQLite schema van fase 1** (geen UI bouwen):

```sql
CREATE TABLE otto_markers (
  id INTEGER PRIMARY KEY,
  meeting_id TEXT NOT NULL,
  segment_id TEXT,              -- NULL = markering op de hele meeting
  type TEXT NOT NULL,           -- 'flag' | 'clarify' | 'action' | 'agent_question'
  audio_ts_ms INTEGER,          -- positie in de opname
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',  -- 'open' | 'processed' | 'answered' | 'done'
  payload TEXT                  -- json: citaat, spreker, vraag, antwoord, ottomap_item_id
);
```

OttoMap koppeling is fase 2: items schrijven via de bestaande OttoMap Supabase conventies (zie de CLAUDE.md van de ottoMap repo, `pam_boards`, surgical `jsonb_set`).

## B. Agent verheldering (fase 2)

De meeluisterende agent houdt zijn eigen onduidelijkheden bij. Wanneer context ontbreekt of dubbelzinnig is ("bedoelde Marcus optie één of twee?") stelt hij de vraag aan Ayat via de coach-view op de telefoon. Antwoorden kan met een tik (keuzeknoppen) of gesproken (het antwoord wordt uit de audio gehaald). Het antwoord voedt de lopende context en de samenvatting. Onbeantwoorde vragen landen als open punten in de vault. Opslag: zelfde `otto_markers` tabel, type `agent_question`. Regels: bronplicht blijft gelden (P4), maximaal een handvol open vragen tegelijk zichtbaar, nooit onderbreken met geluid.

## C. Design files

De UI volgt de mockups in `docs/otto/design/` (map aanmaken, Ayat levert de PNG's):

1. `01-live-transcript.png`, live view: LIVE badge + timer, realtime transcript met spreker + rol-tag + timestamps, coach-suggestie onderaan als kaart mét bron-timestamp, knop "Stop & Sync to Vault"
2. `02-vault-detail.png`, meeting detail na sync: vault status ("Sent to Inbox/"), "View in Obsidian" knop, frontmatter kaart (datum, titel, deelnemers), grounded summary met citaat + timestamp per bullet
3. `03-raw-transcript.png`, raw transcript view (P3) onder de summary, auto-scroll toggle, tab bar Coach / Vault / Meetings / Settings

Stijl: dark theme, paars accent, monospace voor transcript en citaten, suggesties altijd met bronverwijzing. Wanneer Ayat nieuwe design files toevoegt in die map, gelden die als de referentie.
