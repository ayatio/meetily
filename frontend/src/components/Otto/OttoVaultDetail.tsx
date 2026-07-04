'use client';

/**
 * Otto Scribe — vault-detail view.
 *
 * Faithful port of docs/otto/stitch-design1/meeting_detail_desktop_view, scoped
 * via OttoVaultDetail.module.css so the upstream Meetily theme is untouched.
 * Presentational only (no Tauri) so it renders in a plain browser for preview
 * and can be wired to real data by the meeting-details page.
 */

import { useState } from 'react';
import styles from './OttoVaultDetail.module.css';

export interface OttoTranscriptLine {
  ts: string;
  speaker?: string;
  text: string;
  lang?: 'NL' | 'FR' | 'EN' | string;
  marker?: 'flag' | 'action';
  highlight?: boolean;
}

export interface OttoSummaryBullet {
  label?: string;
  text: string;
  cite?: string;
  action?: boolean;
}

export interface OttoVaultDetailProps {
  title: string;
  dateLabel: string;
  durationLabel?: string;
  vaultStatus?: string;
  vaultPath?: string;
  participants: string[];
  tags?: string[];
  summaryIntro?: string;
  bullets?: OttoSummaryBullet[];
  transcript: OttoTranscriptLine[];
  exporting?: boolean;
  status?: { kind: 'ok' | 'err'; text: string } | null;
  onExport?: () => void;
  onAddParticipant?: (name: string) => void;
  onRemoveParticipant?: (name: string) => void;
}

export default function OttoVaultDetail({
  title,
  dateLabel,
  durationLabel,
  vaultStatus = 'Sent to Inbox/',
  participants,
  tags = [],
  summaryIntro,
  bullets = [],
  transcript,
  exporting = false,
  status = null,
  onExport,
  onAddParticipant,
  onRemoveParticipant,
}: OttoVaultDetailProps) {
  const [draft, setDraft] = useState('');

  const commitDraft = () => {
    const name = draft.trim();
    if (name && onAddParticipant) onAddParticipant(name);
    setDraft('');
  };

  return (
    <div className={styles.scope}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>O</div>
          <div>
            <div className={styles.brandName}>Otto AI</div>
            <div className={styles.brandSub}>Second Brain</div>
          </div>
        </div>
        <nav className={styles.nav}>
          <div className={`${styles.navItem} ${styles.active}`}><span className={styles.navIcon}>▤</span>Vault</div>
          <div className={styles.navItem}><span className={styles.navIcon}>▢</span>Meetings</div>
          <div className={styles.navItem}><span className={styles.navIcon}>⚙</span>Settings</div>
        </nav>
        <button className={styles.cta}><span>＋</span>New Recording</button>
        <div className={styles.user}>
          <div className={styles.userAvatar} />
          <span>User Profile</span>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <button className={styles.back}>← Back to Vault</button>
          <div className={styles.topActions}>
            <span className={styles.statusPill}>{vaultStatus}</span>
            <button className={styles.ghostBtn}>↗ View in Obsidian</button>
            <button className={styles.primaryBtn} onClick={onExport} disabled={exporting}>
              {exporting ? 'Exporteren…' : 'Exporteer naar vault'}
            </button>
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.inner}>
            <div>
              <h1 className={styles.title}>{title}</h1>
              <div className={styles.meta}>
                <span>🗓 {dateLabel}</span>
                {durationLabel && (
                  <>
                    <span className={styles.metaDot}>•</span>
                    <span>⏱ {durationLabel}</span>
                  </>
                )}
              </div>
            </div>

            <div className={styles.grid}>
              <section className={styles.card}>
                <div className={styles.cardHead}>
                  <span className={styles.eyebrow}>GROUNDED SUMMARY</span>
                  <span className={styles.sparkle}>✦</span>
                </div>
                {summaryIntro ? (
                  <p className={styles.summaryIntro}>{summaryIntro}</p>
                ) : (
                  <p className={styles.summaryIntro} style={{ color: 'var(--on-surface-variant)' }}>
                    Nog geen samenvatting beschikbaar.
                  </p>
                )}
                {bullets.length > 0 && (
                  <ul className={styles.bullets}>
                    {bullets.map((b, i) => (
                      <li key={i} className={styles.bullet}>
                        <span className={`${styles.bulletDot} ${b.action ? styles.action : ''}`} />
                        {b.label && (
                          <span className={`${styles.bulletLabel} ${b.action ? styles.action : ''}`}>{b.label} </span>
                        )}
                        {b.text}
                        {b.cite && <button className={styles.cite}>{b.cite}</button>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <aside className={styles.card}>
                <span className={styles.eyebrow}>FRONTMATTER</span>
                <div className={styles.fm} style={{ marginTop: 16 }}>
                  <div>
                    <span className={styles.fmLabel}>PARTICIPANTS ({participants.length})</span>
                    <div className={styles.chips}>
                      {participants.map((p) => (
                        <span key={p} className={styles.chip}>
                          {p}
                          {onRemoveParticipant && (
                            <span className={styles.rm} onClick={() => onRemoveParticipant(p)} aria-label={`${p} verwijderen`}>×</span>
                          )}
                        </span>
                      ))}
                      {onAddParticipant && (
                        <input
                          className={styles.addName}
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onBlur={commitDraft}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitDraft(); } }}
                          placeholder="+ naam…"
                        />
                      )}
                    </div>
                  </div>
                  {tags.length > 0 && (
                    <>
                      <hr className={styles.fmDivider} />
                      <div>
                        <span className={styles.fmLabel}>TAGS</span>
                        <div className={styles.chips}>
                          {tags.map((t) => (
                            <span key={t} className={styles.tag}>#{t}</span>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </aside>
            </div>

            <section>
              <div className={styles.rawHead}>
                <span className={styles.rawTitle}>Raw Transcript</span>
                <div className={styles.toggleWrap}>
                  <span>Auto-scroll</span>
                  <span className={styles.toggle} />
                </div>
              </div>
              <div className={styles.transcript}>
                {transcript.map((l, i) => (
                  <div key={i} className={`${styles.line} ${l.marker === 'flag' ? styles.flag : ''} ${l.marker === 'action' ? styles.action : ''}`}>
                    <span className={styles.ts}>{l.ts}</span>
                    <div>
                      {l.speaker && <span className={`${styles.who} ${l.highlight ? styles.hl : ''}`}>{l.speaker}: </span>}
                      <span className={styles.said}>{l.text}</span>
                      {l.lang && <span className={styles.lang}>{l.lang}</span>}
                      {l.marker && (
                        <div className={styles.markerRow}>
                          <span className={`${styles.marker} ${l.marker === 'flag' ? styles.flag : styles.action}`}>
                            {l.marker === 'flag' ? '📌 KEY MOMENT' : '✓ ACTION ITEM'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {status && (
                <div className={`${styles.statusMsg} ${status.kind === 'ok' ? styles.ok : styles.err}`}>{status.text}</div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
