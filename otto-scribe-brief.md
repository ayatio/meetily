# OTTO-SCRIBE.md — bouwbrief

Deze repo is Ayats fork van Meetily. Doel: **Otto Scribe**, een meeting-transcriptie-app die realtime transcribeert, meedenkt (samenvatting + anticipatievragen) en alles naar de Obsidian vault (`~/repos/second-brain/`, alleen `Inbox/`) en OttoMap stuurt. De upstream `CLAUDE.md` in deze repo beschrijft de Meetily codebase, dit document beschrijft wat wij ervan maken. Lees beide voor je begint.

## Architectuur

Eén **motor** (deze app): opname, streaming STT, sprekers, Otto laag. Draait eerst 100% lokaal en offline op de Mac, later dezelfde motor optioneel op een VPS. Dunne **clients** komen later: webapp, telefoon app (afstandsbediening + live coach-view), dedicated Android zaal-toestel. Eén continue opnamestroom + ring buffer + parallelle workers, nooit meerdere opnames.

## Principes (vast, niet onderhandelbaar)

| # | Principe |
|---|---|
| P1 | Opname stopt nooit, de capture thread wacht nooit op verwerking |
| P2 | Audio blijft bewaard, altijd terugluisterbaar |
| P3 | Raw transcript blijft naast elke samenvatting bestaan, niets wordt overschreven |
| P4 | Suggesties zijn gegrond: bronplicht (transcriptcitaat of vault fiche), geen bron = geen suggestie, verificatiepass |
| P5 | Meertalig per segment, NL/FR/EN door elkaar in één meeting |
| P6 | Werkt volledig offline, transcriptie 100% lokaal, alleen tekst (nooit audio) naar de Claude API |
| P7 | Alles eindigt in de vault, schrijven alleen naar `Inbox/`, review via Brainiac |
| P8 | Discreet: geen zichtbare opname-indicatie op de laptop, bediening via de telefoon |
| P9 | Kwaliteit boven snelheid: het beste model dat de hardware aankan |

## Engineering regels

1. **Upstream blijft mergebaar**: Otto code in eigen modules (`frontend/src-tauri/src/otto/`, eigen frontend map), minimale diff in bestaande Meetily bestanden.
2. **Eén ding per keer af**, elke stap een branch + PR, stop voor review bij elke richtingskeuze (D-gate).
3. Beslissingen en bevindingen loggen in `docs/otto/DECISIONS.md` (aanmaken bij fase 1).
4. Geen scope creep: fase 2+ niet bouwen voor fase 1 gereviewd is.

## Fase 1 (nu): bouwen + verifiëren + eerste vault writer

1. **Bouwen en draaien** op macOS (aarch64): `brew install cmake node pnpm`, dan in `frontend/`: `pnpm install && pnpm tauri:dev` (Metal automatisch). Submodules: clone met `--recurse-submodules`.
2. **Modellen hergebruiken**: Ayat draait Handy al, zelfde modelformaten (whisper.cpp GGML, Parakeet ONNX in `~/Library/Application Support/com.pais.handy/models/`). Check of Meetily's modelmap ze kan hergebruiken (symlink of kopie) voor niets dubbel te downloaden.
3. **Verifiëren en rapporteren**: waar bewaart de app audio-opnames (P2)? Waar staat het raw transcript (SQLite schema, P3)? Doet taaldetectie het op NL/FR/EN (P5)? Wat doet `speaker_embedding` in `frontend/src-tauri/src/audio/stt.rs` vandaag al?
4. **Vault writer (eerste Otto stuk)**: na afloop van een meeting één markdown bestand naar `~/repos/second-brain/Inbox/` met frontmatter (datum, titel, deelnemers indien bekend), raw transcript en samenvatting. Nog geen rolling verwerking.
5. Stop, rapporteer in `docs/otto/DECISIONS.md`, wacht op review.

## Fase 2+ (nog niet bouwen)

Rolling verwerking elke 2–5 min (Claude API, bronplicht per suggestie), anticipatievragen, spreker → actor koppeling (clustering op de bestaande speaker embeddings, live taggen), audio versterking (gain/AGC vóór STT), telefoon afstandsbediening + coach-view, webapp client, VPS deployment, Android zaal-toestel.

## Context

Volledige capability map en open punten: `otto-scribe-capabilities.md` in Ayats ottoMap projectmap (`~/Documents/Claude/Projects/ottoMap/`). Vault conventies: de CLAUDE.md van `ayatio/second-brain`.
