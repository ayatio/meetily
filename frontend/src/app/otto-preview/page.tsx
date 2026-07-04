'use client';

/**
 * Dev-only preview of the Otto meeting-detail dashboard (stich-design2),
 * seeded with the real test meeting. Renders without the Tauri desktop shell.
 * Not part of the shipping app flow.
 */

import OttoVaultDetail from '@/components/Otto/OttoVaultDetail';

export default function OttoPreviewPage() {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'auto' }}>
      <OttoVaultDetail
        title="Meeting 2026-07-04 — 03:17"
        dateLabel="4 jul 2026"
        durationLabel="27s"
        participants={['Ayat', 'Caroline', 'Michel']}
        topics={['ONBOARDING', 'MEERTALIG']}
        vaultStatus="Sent to Inbox"
        audio={{ positionLabel: '00:09', durationLabel: '00:27', progress: 0.33 }}
        summary={[
          { category: 'SETUP', text: 'De sessie testte de opname- en transcriptieketen end-to-end; audio en raw transcript worden bewaard (P2/P3).', cite: '[00:03]' },
          { category: 'MEERTALIGHEID', text: 'NL/EN/FR door elkaar in één meeting bevestigd — de transcriptie behoudt de originele taal per segment.', cite: '[00:24]' },
        ]}
        actionItems={[
          { text: 'Verheldering: wat werd bedoeld met "something is going on"?', owner: 'Otto', done: false },
        ]}
        transcript={[
          { ts: '00:00', speaker: 'Spreker ?', text: 'Something' },
          { ts: '00:03', speaker: 'Ayat', text: 'Something, something, testing, testing. Ik ben gewoon wat alles aan het zeggen.', lang: 'NL', highlight: true, marker: 'flag' },
          { ts: '00:12', speaker: 'Ayat', text: "So this was something that I was saying and now it's a meeting. Something is going on", lang: 'EN' },
          { ts: '00:19', speaker: 'Spreker ?', text: 'Something is going on.', lang: 'EN' },
          { ts: '00:21', speaker: 'Spreker ?', text: 'Have you have on' },
          { ts: '00:24', speaker: 'Ayat', text: 'Oui, on va parler français as well, eh?', lang: 'FR', marker: 'action' },
        ]}
      />
    </div>
  );
}
