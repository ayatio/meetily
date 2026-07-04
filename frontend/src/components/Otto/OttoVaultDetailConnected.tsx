'use client';

/**
 * Connects OttoVaultDetail (stich-design2) to real app data:
 * meeting transcript (props), participants + vault export (otto_* commands).
 * Summary display is left empty for now — the export command still embeds the
 * DB summary into the vault note, so nothing is lost.
 */

import { useCallback, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import OttoVaultDetail, { OttoTranscriptLine, OttoSummarySection } from './OttoVaultDetail';

interface SummarySectionLike { title?: string; blocks?: { content?: string }[] }
type SummaryLike = Record<string, SummarySectionLike> | null | undefined;

function mapTopics(summary: SummaryLike): string[] {
  if (!summary) return [];
  const topics = Object.entries(summary)
    .filter(([, v]) => v && typeof v === 'object' && Array.isArray((v as SummarySectionLike).blocks))
    .map(([key, v]) => ((v as SummarySectionLike).title || key).trim())
    .filter((t) => t.length > 0 && t.length <= 22);
  return Array.from(new Set(topics)).slice(0, 6);
}

function mapSummary(summary: SummaryLike): OttoSummarySection[] {
  if (!summary) return [];
  return Object.entries(summary)
    .filter(([, v]) => v && typeof v === 'object' && Array.isArray((v as SummarySectionLike).blocks))
    .map(([key, v]) => {
      const s = v as SummarySectionLike;
      const texts = (s.blocks || []).map((b) => (b?.content ?? '').trim()).filter(Boolean);
      return { category: (s.title || key).toUpperCase(), text: texts.join('  •  ') };
    })
    .filter((s) => s.text.length > 0);
}

interface TranscriptItem {
  id?: string;
  text?: string;
  transcript?: string;
  speaker?: string | null;
  audio_start_time?: number | null;
}

interface MeetingLike {
  id: string;
  title?: string;
  created_at?: string;
  folder_path?: string | null;
}

function fmt(seconds?: number | null): string {
  const s = Math.max(0, Math.floor(seconds ?? 0));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function OttoVaultDetailConnected({
  meeting,
  transcripts,
  summary,
}: {
  meeting: MeetingLike;
  transcripts: TranscriptItem[];
  summary?: SummaryLike;
}) {
  const [participants, setParticipants] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    invoke<string[]>('otto_get_meeting_participants', { meetingId: meeting.id })
      .then((p) => { if (!cancelled) setParticipants(p); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [meeting.id]);

  // Load the meeting's saved audio (P2 — terugluisteren) as a blob URL.
  useEffect(() => {
    let cancelled = false;
    let url: string | undefined;
    const folder = meeting.folder_path;
    if (!folder) { setAudioSrc(undefined); return; }
    const filePath = `${folder}/audio.mp4`;
    invoke<number[]>('read_audio_file', { filePath })
      .then((bytes) => {
        if (cancelled || !bytes || bytes.length === 0) return;
        const blob = new Blob([new Uint8Array(bytes)], { type: 'audio/mp4' });
        url = URL.createObjectURL(blob);
        setAudioSrc(url);
      })
      .catch(() => { if (!cancelled) setAudioSrc(undefined); });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [meeting.folder_path]);

  const persist = useCallback(async (next: string[]) => {
    try {
      const saved = await invoke<string[]>('otto_set_meeting_participants', { meetingId: meeting.id, participants: next });
      setParticipants(saved);
    } catch (e) {
      setStatus({ kind: 'err', text: `Opslaan mislukt: ${e}` });
    }
  }, [meeting.id]);

  const onExport = useCallback(async () => {
    setExporting(true);
    setStatus(null);
    try {
      const path = await invoke<string>('otto_export_meeting_to_vault', { meetingId: meeting.id });
      setStatus({ kind: 'ok', text: `Geschreven naar vault: ${path}` });
    } catch (e) {
      setStatus({ kind: 'err', text: `Export mislukt: ${e}` });
    } finally {
      setExporting(false);
    }
  }, [meeting.id]);

  const lines: OttoTranscriptLine[] = (transcripts || []).map((t) => ({
    ts: fmt(t.audio_start_time),
    speaker: t.speaker || undefined,
    text: (t.text ?? t.transcript ?? '').trim(),
  })).filter((l) => l.text.length > 0);

  const dateLabel = meeting.created_at ? meeting.created_at.split('T')[0] : '';

  return (
    <OttoVaultDetail
      title={meeting.title || 'Meeting'}
      dateLabel={dateLabel}
      participants={participants}
      topics={mapTopics(summary)}
      audioSrc={audioSrc}
      summary={mapSummary(summary)}
      transcript={lines}
      exporting={exporting}
      status={status}
      onExport={onExport}
      onAddParticipant={(name) => {
        if (participants.some((p) => p.toLowerCase() === name.toLowerCase())) return;
        persist([...participants, name]);
      }}
      onRemoveParticipant={(name) => persist(participants.filter((p) => p !== name))}
    />
  );
}
