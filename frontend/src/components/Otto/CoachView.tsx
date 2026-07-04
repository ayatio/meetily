'use client';

/**
 * Otto Scribe — mobile Coach view (PWA client).
 *
 * Port of docs/otto/stich-design2 live_coach, with the interactions Ayat
 * described: transcript balloons carry right-side action icons (clarify /
 * bookmark / flag / action), agent questions pop out and can be minimized to a
 * floating badge, answered, or parked. Mobile-first, self-contained (no Tauri),
 * so it runs as a phone PWA. Seeded with sample data until the motor API bridge
 * feeds it live meeting data.
 */

import { useState } from 'react';
import { Inter, JetBrains_Mono } from 'next/font/google';
import styles from './CoachView.module.css';

const inter = Inter({ subsets: ['latin'], variable: '--otto-inter', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--otto-mono', display: 'swap' });

interface Balloon { ts: string; who: string; text: string; }
interface Point { text: string; cite: string; }
interface Section { topic: string; points: Point[]; }
interface Question { id: number; text: string; options: string[]; }

const SECTIONS: Section[] = [
  {
    topic: '# EXCO REVIEW PREPARATION',
    points: [
      { text: 'Sarah benadrukte dat de Q3-metrics vóór vrijdag geconsolideerd moeten zijn; de focus ligt op ROI van de nieuwe kanalen.', cite: '12:45' },
      { text: 'David neemt de slide-deck op zich, met data rechtstreeks uit de nieuwe Tableau-dashboards.', cite: '14:20' },
    ],
  },
  {
    topic: '# WORKFRONT MIGRATION',
    points: [
      { text: 'De migratie-timeline schuift twee weken op door API-rate-limits tijdens de eerste sync-test.', cite: '28:15' },
    ],
  },
];

const BALLOONS: Balloon[] = [
  { ts: '44:10', who: 'Sarah', text: 'Als we naar de Q3-rollout kijken, is de vraag of de staging de load aankan. Marcus, wat is het plan?' },
  { ts: '44:32', who: 'Marcus', text: "We schalen de instances nu op. Staging spiegelt productie, maar we moeten regionale compliance verifiëren voor de volledige deployment." },
  { ts: '45:05', who: 'Sarah', text: 'Juist, regionale compliance. Maar betekent dat we…' },
];

const QUESTIONS: Question[] = [
  { id: 1, text: 'Bedoelde Marcus dat de staging-aanpak voor alle regio\'s geldt of alleen EU?', options: ['Alle regio\'s', 'Alleen EU'] },
  { id: 2, text: 'Is de Q3-deadline hard, of is er speling tot volgende sprint?', options: ['Hard', 'Speling'] },
];

const ACTS: { key: string; icon: string; cls: string }[] = [
  { key: 'clarify', icon: '?', cls: 'clarify' },
  { key: 'bookmark', icon: '🔖', cls: 'bookmark' },
  { key: 'flag', icon: '⚑', cls: 'flag' },
  { key: 'action', icon: '⚡', cls: 'action' },
];

export default function CoachView() {
  const [tab, setTab] = useState<'summary' | 'transcript'>('summary');
  const [focus, setFocus] = useState(false);
  const [questions, setQuestions] = useState<Question[]>(QUESTIONS);
  const [qIndex, setQIndex] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  const flash = (m: string) => { setToast(m); window.setTimeout(() => setToast(null), 1800); };

  const answer = (q: Question, opt: string) => {
    flash(`Beantwoord: "${opt}"`);
    dropQuestion(q.id);
  };
  const park = (q: Question) => { flash('Geparkeerd → vault'); dropQuestion(q.id); };
  const dropQuestion = (id: number) => {
    setQuestions((prev) => {
      const next = prev.filter((x) => x.id !== id);
      setQIndex((i) => Math.min(i, Math.max(0, next.length - 1)));
      return next;
    });
  };

  const toggleMark = (ballTs: string, key: string) => {
    setMarks((prev) => {
      const cur = prev[ballTs];
      const next = { ...prev };
      if (cur === key) delete next[ballTs]; else next[ballTs] = key;
      return next;
    });
    const label = key === 'clarify' ? 'Verheldering gevraagd' : key === 'bookmark' ? 'Bladwijzer' : key === 'flag' ? 'Gemarkeerd' : 'Actie → OttoMap';
    flash(label);
  };

  const currentQ = questions[qIndex];

  return (
    <div className={`${styles.scope} ${inter.variable} ${mono.variable}`}>
      <header className={styles.header}>
        <button className={styles.hamburger} aria-label="Menu">☰</button>
        <span className={styles.brand}>Otto Scribe</span>
        <span className={styles.avatar} />
      </header>

      <div className={styles.titleRow}>
        <h1 className={styles.title}>Q3 Product Strategy Sync</h1>
        <button className={`${styles.focusBtn} ${focus ? styles.on : ''}`} onClick={() => setFocus((f) => !f)}>
          <span className={`${styles.switch} ${focus ? styles.on : ''}`} />
          Focus
        </button>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'transcript' ? styles.active : ''}`} onClick={() => setTab('transcript')}>Transcript</button>
        <button className={`${styles.tab} ${tab === 'summary' ? styles.active : ''}`} onClick={() => setTab('summary')}>Summary</button>
      </div>

      <div className={styles.body}>
        {tab === 'summary' ? (
          <>
            {SECTIONS.map((s) => (
              <div key={s.topic}>
                <div className={styles.topic}>{s.topic}</div>
                <div className={styles.card}>
                  {s.points.map((p, i) => (
                    <div key={i} className={styles.point}>
                      <span className={styles.pointDot} />
                      <div className={styles.pointBody}>
                        <div className={styles.pointText}>{p.text}</div>
                        <span className={styles.cite}>🔗 <span className={styles.ts}>[{p.cite}]</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {!focus && !minimized && currentQ && (
              <div className={`${styles.card} ${styles.agent}`}>
                <div className={styles.agentHead}>
                  <span className={styles.agentTag}>🤖 AGENT CLARIFICATION</span>
                  <span className={styles.dots}>
                    {questions.map((q, i) => (
                      <span key={q.id} className={`${styles.dot} ${i === qIndex ? styles.on : ''}`} onClick={() => setQIndex(i)} />
                    ))}
                  </span>
                </div>
                <div className={styles.agentQ}>{currentQ.text}</div>
                <div className={styles.answers}>
                  {currentQ.options.map((o) => (
                    <button key={o} className={styles.answer} onClick={() => answer(currentQ, o)}>{o}</button>
                  ))}
                </div>
                <div className={styles.agentFoot}>
                  <button className={styles.park} onClick={() => park(currentQ)}>Park to Queue</button>
                  <button className={styles.reply} onClick={() => setMinimized(true)}>Minimaliseer</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {BALLOONS.map((b) => (
              <div key={b.ts} className={styles.balloon}>
                <div className={styles.balloonMeta}>
                  <span className={styles.who}>{b.who}</span>
                  <span className={styles.btime}>{b.ts}</span>
                </div>
                <div className={styles.balloonText}>{b.text}</div>
                <div className={styles.actions}>
                  {ACTS.map((a) => (
                    <button
                      key={a.key}
                      className={`${styles.act} ${styles[a.cls]} ${marks[b.ts] === a.key ? styles.on : ''}`}
                      onClick={() => toggleMark(b.ts, a.key)}
                      aria-label={a.key}
                    >
                      {a.icon}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* minimized floating questions */}
      {!focus && minimized && questions.length > 0 && (
        <div className={styles.floating}>
          <button className={styles.floatBtn} onClick={() => setMinimized(false)} aria-label="Open vragen">
            ?
            <span className={styles.badge}>{questions.length}</span>
          </button>
        </div>
      )}

      <nav className={styles.tabbar}>
        <button className={`${styles.navTab} ${styles.active}`}><span className={styles.navIc}>◎</span>Coach</button>
        <button className={styles.navTab}><span className={styles.navIc}>▤</span>Vault</button>
        <button className={styles.navTab}><span className={styles.navIc}>☷</span>Meetings</button>
        <button className={styles.navTab}><span className={styles.navIc}>⚙</span>Settings</button>
      </nav>

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
