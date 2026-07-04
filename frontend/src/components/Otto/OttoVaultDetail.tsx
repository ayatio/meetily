'use client';

/**
 * Otto Scribe — meeting-detail dashboard.
 *
 * Faithful port of docs/otto/stich-design2/meeting_detail_desktop_dashboard,
 * scoped via OttoVaultDetail.module.css so the upstream Meetily theme is
 * untouched. Two columns: Executive Summary + Action Items (left), raw
 * transcript (right), with an audio player (P2) and topic pills.
 *
 * Presentational only (no Tauri) so it renders standalone for preview and can
 * be wired to real data by the meeting-details page.
 */

import { useState } from 'react';
import { GeistSans } from 'geist/font/sans';
import { Inter, JetBrains_Mono } from 'next/font/google';
import styles from './OttoVaultDetail.module.css';

const inter = Inter({ subsets: ['latin'], variable: '--otto-inter', display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--otto-mono', display: 'swap' });

export interface OttoTranscriptLine {
  ts: string;
  speaker?: string;
  text: string;
  lang?: 'NL' | 'FR' | 'EN' | string;
  marker?: 'flag' | 'action';
  highlight?: boolean;
}

export interface OttoSummarySection {
  category: string;
  text: string;
  cite?: string;
}

export interface OttoActionItem {
  text: string;
  owner?: string;
  done?: boolean;
}

export interface OttoVaultDetailProps {
  title: string;
  dateLabel: string;
  durationLabel?: string;
  participants: string[];
  topics?: string[];
  vaultStatus?: string;
  audio?: { positionLabel: string; durationLabel: string; progress: number };
  summary?: OttoSummarySection[];
  actionItems?: OttoActionItem[];
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
  participants,
  topics = [],
  vaultStatus = 'Sent to Inbox',
  audio,
  summary = [],
  actionItems = [],
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
    <div className={`${styles.scope} ${GeistSans.variable} ${inter.variable} ${jetbrains.variable}`}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandName}>Otto AI</span>
          <span className={styles.brandSub}>Second Brain</span>
        </div>
        <button className={styles.cta}><span>＋</span>New Recording</button>
        <nav className={styles.nav}>
          <div className={styles.navItem}><span className={styles.navIcon}>▤</span>Vault</div>
          <div className={`${styles.navItem} ${styles.active}`}><span className={styles.navIcon}>▢</span>Meetings</div>
          <span className={styles.navSpacer} />
          <div className={styles.navItem}><span className={styles.navIcon}>⚙</span>Settings</div>
        </nav>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <span className={styles.statusPill}>
            <span className={styles.ok}>◉</span> Vault Status: {vaultStatus}
          </span>
          <div className={styles.search}>
            <span>⌕</span>
            <input placeholder="Search transcript…" />
          </div>
          <div className={styles.topIcons}>
            <button className={styles.primaryBtn} onClick={onExport} disabled={exporting}>
              {exporting ? 'Exporteren…' : 'Sync to Vault'}
            </button>
            <button className={styles.ghostBtn}>↗ Obsidian</button>
            <span className={styles.avatar} />
          </div>
        </header>

        <div className={styles.body}>
          {/* LEFT: summary + actions */}
          <div className={styles.colLeft}>
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
                <span className={styles.metaDot}>•</span>
                <span>👥 {participants.length} Participants</span>
              </div>
              <div className={styles.topics}>
                {topics.map((t) => (
                  <span key={t} className={styles.topic}>{t}</span>
                ))}
                {participants.map((p) => (
                  <span key={p} className={styles.topic} style={{ textTransform: 'none' }}>
                    {p}
                    {onRemoveParticipant && <span className={styles.chipX} onClick={() => onRemoveParticipant(p)}>×</span>}
                  </span>
                ))}
                {onAddParticipant && (
                  <input
                    className={styles.addName}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commitDraft}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitDraft(); } }}
                    placeholder="+ deelnemer…"
                  />
                )}
              </div>
            </div>

            {audio && (
              <div className={styles.player}>
                <button className={styles.play}>▶</button>
                <div className={styles.playerBody}>
                  <div className={styles.scrub}>
                    <div className={styles.scrubFill} style={{ width: `${Math.round(audio.progress * 100)}%` }} />
                  </div>
                  <div className={styles.scrubTimes}>
                    <span>{audio.positionLabel}</span>
                    <span>{audio.durationLabel}</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h2 className={styles.h2}>Executive Summary</h2>
              {summary.length > 0 ? (
                summary.map((s, i) => (
                  <div key={i} className={styles.summaryCard}>
                    <div className={styles.summaryHead}>
                      <span className={styles.cat}>{s.category}</span>
                      {s.cite && <button className={styles.cite}>{s.cite}</button>}
                    </div>
                    <p className={styles.summaryText}>{s.text}</p>
                  </div>
                ))
              ) : (
                <p className={styles.empty}>Nog geen samenvatting beschikbaar.</p>
              )}
            </div>

            {actionItems.length > 0 && (
              <div>
                <h2 className={styles.h2}>Action Items</h2>
                {actionItems.map((a, i) => (
                  <div key={i} className={styles.actionItem}>
                    <span className={`${styles.checkbox} ${a.done ? styles.done : ''}`} />
                    <span className={styles.actionText}>{a.text}</span>
                    {a.owner && <span className={styles.owner}>@{a.owner}</span>}
                  </div>
                ))}
              </div>
            )}

            {status && (
              <div className={`${styles.statusMsg} ${status.kind === 'ok' ? styles.ok : styles.err}`}>{status.text}</div>
            )}
          </div>

          {/* RIGHT: raw transcript */}
          <div className={styles.colRight}>
            <div className={styles.rawHead}>
              <span className={styles.rawTitle}>Raw Transcript</span>
            </div>
            {transcript.map((l, i) => (
              <div key={i} className={`${styles.line} ${l.highlight ? styles.hl : ''}`}>
                <span className={styles.ts}>{l.ts}</span>
                <div className={styles.lineBody}>
                  {l.speaker && <span className={styles.who}>{l.speaker}</span>}
                  <span className={styles.said}>
                    {l.text}
                    {l.lang && <span className={styles.lang}>{l.lang}</span>}
                  </span>
                  {l.marker && (
                    <div>
                      <span className={`${styles.marker} ${l.marker === 'flag' ? styles.flag : styles.action}`}>
                        {l.marker === 'flag' ? '📌 KEY MOMENT' : '✓ ACTION ITEM'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
