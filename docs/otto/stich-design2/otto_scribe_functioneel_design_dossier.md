# Otto Scribe — Volledig Functioneel & Design Dossier

Dit document combineert de canonieke functionele analyse, de bouwbrief en de tijdens de sessies bevestigde design-keuzes (inclusief gesture-logic).

---

## 1. Projectvisie & Principes
Otto Scribe is een privacy-first, realtime meeting-coach. Het draait als een "headless" motor op de Mac (geen zichtbare indicatie) en wordt bediend via de iPhone (Coach-view).

### Onwrikbare Principes (P1-P9)
- **P1: Continue Opname.** De capture-thread wacht nooit op verwerking.
- **P2: Audio is Heilig.** Alles wordt bewaard en is terugluisterbaar.
- **P3: Raw Transcriptie.** Het volledige transcript blijft altijd bestaan naast de samenvatting.
- **P4: Grounding.** Geen hallucinaties; elke AI-suggestie moet een bron-citaat met timestamp hebben.
- **P5: Meertalig.** Ondersteuning voor NL/FR/EN door elkaar in één gesprek.
- **P6: Offline First.** Transcriptie is 100% lokaal. Alleen tekst gaat (indien gewenst) naar Claude.
- **P7: Vault Integratie.** Alles eindigt in de Obsidian vault (`Inbox/`).
- **P8: Discreet.** Geen opname-indicatie op de laptop; bediening via de telefoon.
- **P9: Kwaliteit.** Het beste model dat de hardware aankan (Whisper/Parakeet).

---

## 2. Bevestigde Design & Interactie (The "Ayat" Standard)

### Visuele Identiteit
- **Mood:** Technisch, rustig, "precision instrument".
- **Kleuren:** Deep dark (#0D0D12), lavender accenten (#B9B3F5) voor sprekers en actieve elementen.
- **Typografie:** Inter voor UI, JetBrains Mono voor transcripties en citaten.

### Transcript Interacties (iPhone Native Gestures)
De interactie met tekstballonnen volgt de standaard iOS-logica:
- **Swipe naar RECHTS:** Onthult de **CLARIFY** actie (vraagteken icoon). Voor momenten die verheldering nodig hebben.
- **Swipe naar LINKS:** Onthult de **BOOKMARK** actie (bladwijzer icoon). Voor persoonlijk terugvinden.
- **Markers:** Naast swipe zijn ook **FLAG** (belangrijk moment) en **ACTION** (direct naar OttoMap) beschikbaar via de uitgebreide tray.

### Agent Clarification & Focus Mode
- **Focus Mode:** Een slider bovenin die notificaties onderdrukt. Vragen worden in de achtergrond verzameld.
- **Minimized Intelligence:** Vragen van de agent verschijnen als een klein zwevend "?" icoon met een badge.
- **Pop-out:** Tappen op het icoon "popt" de vraagkaarten uit (max 3 tegelijk).
- **Acties:** Per vraag kun je antwoorden, "Park to Queue" (naar de vault) of "Ignore".

### Informatie Architectuur
- **Topic Pills:** Elk segment draagt chips (bijv. #EXCO, #WORKFRONT).
- **Threading:** De UI kan wisselen tussen chronologisch en "By Thread" (gegroepeerd per onderwerp).
- **Grounded Summary:** Samenvattingen zijn per topic en bevatten klikbare bron-timestamps `[mm:ss]`.

---

## 3. Functionele Specificaties (Fase 1 & 2)

### Datamodel (SQLite)
- `otto_markers`: ID, meeting_id, type (bookmark/flag/clarify/action), timestamp, status, payload.
- `otto_topics`: Register van onderwerpen gekoppeld aan de vault en OttoMap.

### Flows
- **F-01 Start:** One-tap start op mobiel of via remote-signaal.
- **F-02 OttoMap Sync:** Actie-items (⚡) worden direct naar het Supabase bord geschoten met context.
- **F-03 Rolling Pass:** Elke 2-5 minuten ververst de coach-view met een nieuwe samenvatting en anticipatievragen.
- **F-04 Stop & Sync:** Definitieve summary naar `Obsidian/Inbox/`. Bevat frontmatter, grounded bullets en open punten.

---

## 4. Schermoverzicht (Referentie-IDs)
- **S-01:** Meetings overzicht (Sync status: Synced/Pending/Local).
- **S-02:** Setup (Participants picker uit vault actoren, Topic register).
- **S-03:** Live Transcript (Live badge, timer, streaming text, swipe-gestures).
- **S-04:** Coach View (Rolling summary, Anticipate cards, Question queue).
- **S-05:** Meeting Detail (Audio player, Vault status, Obsidian link).

---
*Gegenereerd door Stitch op basis van de bevestigde mockups en functionele addenda.*
