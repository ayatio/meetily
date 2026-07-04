'use client';

/**
 * Otto Scribe — live recording view (docs/otto/stich-design2 live_coach_desktop).
 * Full-screen while recording. Left: streaming transcript with speaker +
 * timestamps + live cursor, and Bookmark / Action Item / Flag Risk actions.
 * Right: rolling grounded summary, Coach: Anticipate, Suggested Clarifications —
 * driven live by the local Otto agent (otto_coach_pass).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { useTranscripts } from '@/contexts/TranscriptContext';
import { useRecordingState } from '@/contexts/RecordingStateContext';
import styles from './OttoLiveView.module.css';

const inter = Inter({ subsets: ['latin'], variable: '--otto-inter', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--otto-mono', display: 'swap' });

interface Bullet { text: string; cite?: string | null; }
interface Anticipate { title: string; body: string; kind?: string | null; }
interface CoachResult { topic?: string; summary: Bullet[]; anticipate: Anticipate[]; clarifications: string[]; }

const ROLL_MS = 40000;
const FIRST_MS = 15000;

const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const who = (s?: string | null) => (s === 'mic' ? 'Jij' : s === 'system' ? 'Anderen' : s || 'Spreker');

export default function OttoLiveView() {
  const { transcripts, meetingTitle } = useTranscripts() as any;
  const recordingState = useRecordingState();
  const isRecording = !!recordingState.isRecording;

  const [elapsed, setElapsed] = useState(0);
  const [coach, setCoach] = useState<CoachResult | null>(null);
  const [thinking, setThinking] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [focus, setFocus] = useState(false);
  const [parked, setParked] = useState<Set<string>>(new Set());
  const transcriptsRef = useRef<any[]>(transcripts);
  transcriptsRef.current = transcripts;
  const scrollRef = useRef<HTMLDivElement>(null);

  // elapsed timer
  useEffect(() => {
    if (!isRecording) { setElapsed(0); setCoach(null); return; }
    const start = Date.now();
    const iv = window.setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => window.clearInterval(iv);
  }, [isRecording]);

  // rolling coach pass
  const runPass = useCallback(async () => {
    const lines = (transcriptsRef.current || [])
      .filter((t) => (t.text || '').trim())
      .map((t) => `[${clock(t.audio_start_time || 0)}] ${(t.speaker ? who(t.speaker) + ': ' : '')}${t.text.trim()}`);
    if (lines.length === 0) return;
    setThinking(true);
    try {
      const r = await invoke<CoachResult>('otto_coach_pass', { transcript: lines.join('\n') });
      if (r) setCoach(r);
    } catch (e) { console.warn('otto_coach_pass failed:', e); }
    finally { setThinking(false); }
  }, []);

  useEffect(() => {
    if (!isRecording) return;
    const t0 = window.setTimeout(runPass, FIRST_MS);
    const iv = window.setInterval(runPass, ROLL_MS);
    return () => { window.clearTimeout(t0); window.clearInterval(iv); };
  }, [isRecording, runPass]);

  // auto-scroll transcript
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [transcripts]);

  // Add a marker, optionally tied to a specific transcript bubble (segment).
  const addMarker = useCallback(async (type: string, label: string, seg?: any) => {
    const src = seg ?? (transcriptsRef.current || []).slice(-1)[0];
    const tsMs = seg ? Math.floor((seg.audio_start_time || 0) * 1000) : Math.floor(elapsed * 1000);
    const payload = JSON.stringify({ line: src?.text || '', speaker: src?.speaker || null, ts: src?.audio_start_time ?? null });
    try {
      await invoke('otto_add_marker', {
        meetingId: meetingTitle || 'live-session',
        markerType: type,
        audioTsMs: tsMs,
        payload,
      });
    } catch (e) { console.warn('marker failed:', e); }
    setFlash(label);
    window.setTimeout(() => setFlash(null), 1600);
  }, [meetingTitle, elapsed]);

  const BUBBLE_ACTS: { type: string; icon: string; label: string; cls: string }[] = [
    { type: 'clarify', icon: '❓', label: 'Verheldering gevraagd', cls: 'clarify' },
    { type: 'bookmark', icon: '🔖', label: 'Bladwijzer gezet', cls: 'bookmark' },
    { type: 'flag', icon: '⚑', label: 'Risico gemarkeerd', cls: 'flag' },
    { type: 'action', icon: '⚡', label: 'Actie → OttoMap', cls: 'action' },
  ];

  if (!isRecording) return null;

  const turns = (transcripts || []).filter((t: any) => (t.text || '').trim());
  const clars = (coach?.clarifications || []).filter((c) => !parked.has(c));

  return (
    <div className={`${styles.scope} ${inter.variable} ${mono.variable}`}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>O</span>
          <div>
            <div className={styles.brandName}>Otto AI</div>
            <div className={styles.brandSub}>Second Brain</div>
          </div>
        </div>
        <button className={styles.cta}>＋ New Recording</button>
        <nav className={styles.nav}>
          <div className={styles.navItem}><span className={styles.navIcon}>▤</span>Vault</div>
          <div className={`${styles.navItem} ${styles.active}`}><span className={styles.navIcon}>▢</span>Meetings</div>
          <span className={styles.navSpacer} />
          <div className={styles.navItem}><span className={styles.navIcon}>⚙</span>Settings</div>
        </nav>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <span className={styles.liveBadge}><span className={styles.liveDot} />LIVE <span className={styles.liveTime}>{clock(elapsed)}</span></span>
          <span className={styles.sep} />
          <span className={styles.mTitle}>{meetingTitle || 'Live meeting'}</span>
          <div className={styles.topRight}>
            <button
              className={`${styles.focusToggle} ${focus ? styles.on : ''}`}
              onClick={() => setFocus((f) => !f)}
              title="Focus Mode — onderdrukt de coach-notificaties; vragen worden op de achtergrond verzameld"
            >
              <span className={`${styles.switch} ${focus ? styles.on : ''}`} />
              Focus
            </button>
            <button
              className={styles.stopBtn}
              onClick={() => window.dispatchEvent(new CustomEvent('otto-stop-recording'))}
            >
              ⏹ Stop &amp; Sync to Vault
            </button>
            <span className={styles.avatar} />
          </div>
        </header>

        <div className={styles.body}>
          {/* LEFT: streaming transcript */}
          <section className={styles.colLeft}>
            <div className={styles.topicRow}>
              <span className={styles.topicLabel}>◎ CURRENT TOPIC:</span>
              <span className={styles.topicPill}>{coach?.topic || '—'}</span>
            </div>
            <div className={styles.transcript} ref={scrollRef}>
              {turns.length === 0 ? (
                <div className={styles.emptyLine}>Otto luistert mee… spreek om het live transcript te zien.</div>
              ) : (
                turns.map((t: any, i: number) => {
                  const live = i === turns.length - 1;
                  return (
                    <div key={t.id || i} className={`${styles.turn} ${live ? styles.live : ''}`}>
                      <span className={styles.tTime}>{clock(t.audio_start_time || 0)}</span>
                      <div className={styles.tBody}>
                        <span className={styles.tWho}>{who(t.speaker)}{live && <span className={styles.tLiveDot} />}</span>
                        <div className={styles.tText}>{t.text}{live && <span className={styles.caret} />}</div>
                      </div>
                      <div className={styles.turnActions}>
                        {BUBBLE_ACTS.map((a) => (
                          <button
                            key={a.type}
                            className={`${styles.bAct} ${styles[a.cls]}`}
                            title={a.label}
                            onClick={() => addMarker(a.type, a.label, t)}
                          >
                            {a.icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className={styles.actions}>
              <button className={styles.actBtn} onClick={() => addMarker('bookmark', 'Bladwijzer gezet')}>
                {flash === 'Bladwijzer gezet' ? <span className={styles.flash}>✓ {flash}</span> : '🔖 Bookmark'}
              </button>
              <button className={styles.actBtn} onClick={() => addMarker('action', 'Actie-item → OttoMap')}>
                {flash === 'Actie-item → OttoMap' ? <span className={styles.flash}>✓ {flash}</span> : '✓ Action Item'}
              </button>
              <button className={`${styles.actBtn} ${styles.flag}`} onClick={() => addMarker('flag', 'Risico gemarkeerd')}>
                {flash === 'Risico gemarkeerd' ? <span className={styles.flash}>✓ {flash}</span> : '⚑ Flag Risk'}
              </button>
            </div>
          </section>

          {/* RIGHT: coach */}
          <aside className={styles.colRight}>
            <div className={styles.secLabel}>☰ ROLLING SUMMARY</div>
            <div className={styles.summaryCard}>
              {coach && coach.summary && coach.summary.length > 0 ? (
                coach.summary.map((b, i) => (
                  <div key={i} className={styles.sBullet}>
                    <span className={styles.sDot} />
                    <div>{b.text}{b.cite && <span className={styles.cite}>{b.cite}</span>}</div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyLine}>Otto vat het gesprek samen zodra er genoeg gezegd is…</div>
              )}
              {thinking && <div className={styles.synth}>↻ Otto denkt mee…</div>}
            </div>

            {focus ? (
              <div className={styles.focusNote}>
                🌙 Focus Mode — Otto verzamelt {clars.length} vraag(en) op de achtergrond.
              </div>
            ) : (
              <>
                <div className={styles.secLabel}>◍ COACH: ANTICIPATE</div>
                {coach && coach.anticipate && coach.anticipate.length > 0 ? (
                  coach.anticipate.map((a, i) => (
                    <div key={i} className={`${styles.antCard} ${a.kind === 'risk' ? styles.risk : ''}`}>
                      <span className={styles.antIcon}>{a.kind === 'risk' ? '⚠' : '⟳'}</span>
                      <div>
                        <div className={styles.antTitle}>{a.title}</div>
                        <div className={styles.antBody}>{a.body}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyLine}>Nog geen inzichten.</div>
                )}

                <div className={`${styles.secLabel} ${styles.clar}`}>💬 SUGGESTED CLARIFICATIONS</div>
                {clars.length > 0 ? (
                  clars.map((c, i) => (
                    <div key={i} className={styles.clarCard}>
                      <span className={styles.clarText}>{c}</span>
                      <button
                        className={styles.clarAsk}
                        title="Park to Queue — bewaar deze vraag voor de vault"
                        onClick={() => { setParked((p) => new Set(p).add(c)); addMarker('clarify', 'Vraag geparkeerd', undefined); }}
                      >
                        Park
                      </button>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyLine}>Nog geen vragen.</div>
                )}
              </>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
