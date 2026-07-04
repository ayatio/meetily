'use client';

/**
 * Otto Scribe — per-meeting bar.
 *
 * Self-contained Otto UI (kept in its own folder so the upstream Meetily diff
 * stays a single import). Two things today:
 *  - select meeting participants (free text + remembered-name autocomplete),
 *    saved via the otto_* commands and written into the vault note frontmatter.
 *  - export the meeting to the Obsidian vault Inbox/ on demand.
 *
 * Speaker-level attribution (diarisation) is separate and lands later.
 */

import { useEffect, useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface OttoMeetingBarProps {
  meetingId: string;
}

export default function OttoMeetingBar({ meetingId }: OttoMeetingBarProps) {
  const [participants, setParticipants] = useState<string[]>([]);
  const [known, setKnown] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Load current participants + remembered names when the meeting changes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [current, all] = await Promise.all([
          invoke<string[]>('otto_get_meeting_participants', { meetingId }),
          invoke<string[]>('otto_list_known_participants'),
        ]);
        if (!cancelled) {
          setParticipants(current);
          setKnown(all);
        }
      } catch (e) {
        if (!cancelled) setStatus({ kind: 'err', text: `Kon deelnemers niet laden: ${e}` });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [meetingId]);

  const persist = useCallback(
    async (next: string[]) => {
      setSaving(true);
      setStatus(null);
      try {
        const saved = await invoke<string[]>('otto_set_meeting_participants', {
          meetingId,
          participants: next,
        });
        setParticipants(saved);
      } catch (e) {
        setStatus({ kind: 'err', text: `Opslaan mislukt: ${e}` });
      } finally {
        setSaving(false);
      }
    },
    [meetingId]
  );

  const addDraft = useCallback(() => {
    const name = draft.trim();
    if (!name) return;
    if (participants.some((p) => p.toLowerCase() === name.toLowerCase())) {
      setDraft('');
      return;
    }
    const next = [...participants, name];
    setDraft('');
    persist(next);
  }, [draft, participants, persist]);

  const removeParticipant = useCallback(
    (name: string) => {
      persist(participants.filter((p) => p !== name));
    },
    [participants, persist]
  );

  const exportToVault = useCallback(async () => {
    setExporting(true);
    setStatus(null);
    try {
      const path = await invoke<string>('otto_export_meeting_to_vault', { meetingId });
      setStatus({ kind: 'ok', text: `Geschreven naar vault: ${path}` });
    } catch (e) {
      setStatus({ kind: 'err', text: `Export mislukt: ${e}` });
    } finally {
      setExporting(false);
    }
  }, [meetingId]);

  const suggestions = known.filter(
    (k) => !participants.some((p) => p.toLowerCase() === k.toLowerCase())
  );

  return (
    <div className="border-b border-gray-200 bg-white px-4 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Otto</span>

        <span className="text-sm text-gray-500">Deelnemers:</span>

        {participants.map((p) => (
          <span
            key={p}
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-sm text-gray-800"
          >
            {p}
            <button
              type="button"
              onClick={() => removeParticipant(p)}
              className="text-gray-400 hover:text-gray-700"
              aria-label={`${p} verwijderen`}
            >
              ×
            </button>
          </span>
        ))}

        <input
          list="otto-known-participants"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addDraft();
            }
          }}
          onBlur={addDraft}
          placeholder="Naam toevoegen…"
          className="min-w-[10rem] flex-1 rounded border border-gray-200 px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
        />
        <datalist id="otto-known-participants">
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>

        {saving && <span className="text-xs text-gray-400">opslaan…</span>}

        <button
          type="button"
          onClick={exportToVault}
          disabled={exporting}
          className="ml-auto rounded bg-gray-900 px-3 py-1 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {exporting ? 'Exporteren…' : 'Exporteer naar vault'}
        </button>
      </div>

      {status && (
        <div
          className={`mt-1 truncate text-xs ${status.kind === 'ok' ? 'text-green-600' : 'text-red-600'}`}
          title={status.text}
        >
          {status.text}
        </div>
      )}
    </div>
  );
}
