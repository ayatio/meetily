'use client';

/**
 * Dev-only preview of the Otto vault-detail design, seeded with the real test
 * meeting. Lets the designed view be rendered/screenshotted without the Tauri
 * desktop shell. Not part of the shipping app flow.
 */

import OttoVaultDetail from '@/components/Otto/OttoVaultDetail';

export default function OttoPreviewPage() {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'auto' }}>
      <OttoVaultDetail
        title="Meeting 2026-07-04 — 03:17"
        dateLabel="4 jul 2026 • 03:17"
        durationLabel="00m 27s"
        vaultStatus="Sent to Inbox/"
        participants={['Ayat', 'Caroline', 'Michel']}
        tags={['otto-scribe', 'meeting', 'inbox']}
        summaryIntro="Korte test van de opname- en transcriptieketen. Bevestigd dat meertalig door elkaar werkt: Nederlands, Engels en Frans in één sessie."
        bullets={[
          { label: 'Setup:', text: 'Meeting begon als een test van de opname- en transcriptiepijplijn.', cite: '[00:03]' },
          { label: 'Meertaligheid:', text: 'NL/EN/FR door elkaar in één meeting bevestigd.', cite: '[00:24]' },
          { label: 'Open punt:', text: 'Verheldering gevraagd bij "something is going on".', cite: '[00:19]', action: true },
        ]}
        transcript={[
          { ts: '00:00', speaker: 'spreker ?', text: 'Something' },
          { ts: '00:03', speaker: 'Ayat', text: 'Something, something, testing, testing. Ik ben gewoon wat alles aan het zeggen.', lang: 'NL', highlight: true, marker: 'flag' },
          { ts: '00:12', speaker: 'Ayat', text: "So this was something that I was saying and now it's a meeting. Something is going on", lang: 'EN', highlight: true },
          { ts: '00:19', speaker: 'spreker ?', text: 'Something is going on.', lang: 'EN' },
          { ts: '00:21', speaker: 'spreker ?', text: 'Have you have on' },
          { ts: '00:24', speaker: 'Ayat', text: 'Oui, on va parler français as well, eh?', lang: 'FR', highlight: true, marker: 'action' },
        ]}
      />
    </div>
  );
}
