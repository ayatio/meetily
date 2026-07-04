'use client';

/**
 * Live Otto coach panel (S-04 / F-03). While recording, every rolling interval
 * it sends the live transcript to the local Otto agent (otto_coach_pass) and
 * shows a rolling grounded summary + anticipation questions with source
 * citations — live, during the meeting.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTranscripts } from '@/contexts/TranscriptContext';
import { useRecordingState } from '@/contexts/RecordingStateContext';

interface CoachQuestion { text: string; cite?: string | null; }
interface CoachResult { summary: string; questions: CoachQuestion[]; }

const ROLL_MS = 45000; // rolling pass every 45s
const FIRST_MS = 18000; // first pass sooner

function fmt(s?: number): string {
  const t = Math.max(0, Math.floor(s ?? 0));
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

export default function OttoLiveCoach() {
  const { transcripts } = useTranscripts();
  const recordingState = useRecordingState();
  const isRecording = !!recordingState.isRecording;

  const [result, setResult] = useState<CoachResult | null>(null);
  const [thinking, setThinking] = useState(false);
  const [lastAt, setLastAt] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const transcriptsRef = useRef(transcripts);
  transcriptsRef.current = transcripts;

  const runPass = useCallback(async () => {
    const lines = (transcriptsRef.current || [])
      .filter((t: any) => (t.text || '').trim())
      .map((t: any) => `[${fmt(t.audio_start_time)}] ${t.text.trim()}`);
    if (lines.length === 0) return;
    setThinking(true);
    try {
      const r = await invoke<CoachResult>('otto_coach_pass', { transcript: lines.join('\n') });
      if (r && (r.summary || (r.questions && r.questions.length))) {
        setResult(r);
        const now = new Date();
        setLastAt(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      }
    } catch (e) {
      console.warn('otto_coach_pass failed:', e);
    } finally {
      setThinking(false);
    }
  }, []);

  useEffect(() => {
    if (!isRecording) { setResult(null); setDismissed(new Set()); return; }
    const t0 = window.setTimeout(runPass, FIRST_MS);
    const iv = window.setInterval(runPass, ROLL_MS);
    return () => { window.clearTimeout(t0); window.clearInterval(iv); };
  }, [isRecording, runPass]);

  if (!isRecording) return null;

  const questions = (result?.questions || []).filter((q) => !dismissed.has(q.text));

  return (
    <div style={S.panel}>
      <div style={S.head}>
        <span style={S.dot} />
        <span style={S.title}>OTTO — LIVE COACH</span>
        {thinking ? <span style={S.meta}>denkt…</span> : lastAt && <span style={S.meta}>{lastAt}</span>}
      </div>

      <div style={S.sectionLabel}>ROLLENDE SAMENVATTING</div>
      <div style={S.summary}>{result?.summary || 'Otto luistert mee…'}</div>

      <div style={S.sectionLabel}>ANTICIPATIEVRAGEN</div>
      {questions.length === 0 ? (
        <div style={S.empty}>Nog geen vragen — Otto wacht op meer context.</div>
      ) : (
        questions.map((q, i) => (
          <div key={i} style={S.qCard}>
            <div style={S.qText}>{q.text}</div>
            <div style={S.qFoot}>
              {q.cite && <span style={S.cite}>{q.cite}</span>}
              <button style={S.park} onClick={() => setDismissed((d) => new Set(d).add(q.text))}>Park</button>
            </div>
          </div>
        ))
      )}

      <button style={S.now} onClick={runPass} disabled={thinking}>Nu verversen</button>
    </div>
  );
}

const LAV = '#c2c1ff';
const S: Record<string, React.CSSProperties> = {
  panel: {
    position: 'fixed', top: 16, right: 16, width: 340, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto',
    zIndex: 50, background: '#16121f', border: `1px solid ${LAV}55`, borderRadius: 14, padding: 16,
    boxShadow: '0 10px 30px rgba(0,0,0,.5)', color: '#e6e1f0',
    fontFamily: '-apple-system, system-ui, sans-serif',
  },
  head: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: '50%', background: '#7fdcb0' },
  title: { fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', color: LAV, flex: 1 },
  meta: { fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11, color: '#9a92b0' },
  sectionLabel: { fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', color: '#9a92b0', margin: '14px 0 6px' },
  summary: { fontSize: 13.5, lineHeight: 1.5, color: '#e6e1f0' },
  empty: { fontSize: 12.5, color: '#8a889a' },
  qCard: { background: '#1e1830', border: `1px solid ${LAV}30`, borderRadius: 10, padding: 12, marginBottom: 8 },
  qText: { fontSize: 14, lineHeight: 1.4, color: '#e6e1f0' },
  qFoot: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  cite: { fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12, color: LAV, background: '#2a2340', padding: '2px 7px', borderRadius: 5 },
  park: { fontSize: 12, color: '#9a92b0', background: 'none', border: 'none', cursor: 'pointer' },
  now: { marginTop: 12, width: '100%', padding: '8px', borderRadius: 8, border: 'none', background: '#5e5ce6', color: '#f4f1ff', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
};
