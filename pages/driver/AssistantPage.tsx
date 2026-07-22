import React, { useState } from 'react';
import MissionShell from '../../components/mission-control/MissionShell.tsx';
import ElmCard from '../../design-system/components/ElmCard.tsx';
import EmptyState from '../../design-system/components/EmptyState.tsx';
import { useDriverExperience } from '../../context/DriverExperienceContext.tsx';

const SUGGESTED_QUESTIONS = [
  'What do I need to do next?',
  'When is my delivery appointment?',
  'Can you check my settlement?',
  'How do I submit a reimbursement?',
  'Who do I contact if I need help?',
];

/** ELM AI Assistant — Showcase-only conversational demo. Never takes a real action. */
const AssistantPage: React.FC = () => {
  const { mode, dataSource, actions } = useDriverExperience();
  const thread = dataSource.getAssistantThread();
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [localTurns, setLocalTurns] = useState<
    { id: string; role: 'driver' | 'assistant'; text: string }[]
  >([]);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || !actions.askAssistant) return;
    setBusy(true);
    const driverId = `local-driver-${Date.now()}`;
    setLocalTurns((prev) => [...prev, { id: driverId, role: 'driver', text: q }]);
    const result = await actions.askAssistant(q);
    setLocalTurns((prev) => [
      ...prev,
      { id: `local-assistant-${Date.now()}`, role: 'assistant', text: result.message },
    ]);
    setBusy(false);
    setPrompt('');
  };

  return (
    <MissionShell title="ELM AI" activeNav="more">
      <div className="space-y-6 max-w-2xl">
        <header>
          <p className="mc-kicker">ELM AI</p>
          <h1 className="mc-page-title">Ask ELM AI</h1>
          <p className="mc-section-copy">
            {mode === 'showcase'
              ? 'Scripted demonstration answers only — ELM AI never claims to complete an action it did not perform, and nothing reaches dispatch, payroll, or support.'
              : 'ELM AI is not available yet in this build.'}
          </p>
        </header>

        {mode !== 'showcase' ? (
          <EmptyState
            kicker="ELM AI"
            title="ELM AI isn't available yet"
            description="Contextual assistance will appear here in a future release. Use Home, Trips, Capture, and Pay for your work."
          />
        ) : (
          <>
            <div className="space-y-3">
              {thread.map((t) => (
                <ElmCard key={t.id} padding="sm" variant={t.role === 'driver' ? 'default' : 'muted'}>
                  <p className="mc-kicker mb-1">{t.role === 'driver' ? 'You' : 'ELM AI'}</p>
                  <p className="mc-section-copy">{t.text}</p>
                </ElmCard>
              ))}
              {localTurns.map((t) => (
                <ElmCard key={t.id} padding="sm" variant={t.role === 'driver' ? 'default' : 'muted'}>
                  <p className="mc-kicker mb-1">{t.role === 'driver' ? 'You' : 'ELM AI'}</p>
                  <p className="mc-section-copy">{t.text}</p>
                </ElmCard>
              ))}
            </div>

            <div>
              <p className="mc-kicker mb-2">Suggested questions</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="mc-filter-tab"
                    disabled={busy}
                    onClick={() => ask(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <form
              className="flex gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                ask(prompt);
              }}
            >
              <input
                type="text"
                className="elm-input flex-1"
                placeholder="Ask ELM AI (demonstration)…"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                aria-label="Ask ELM AI"
                disabled={busy}
              />
              <button type="submit" className="mc-exception-action" disabled={busy || !prompt.trim()}>
                {busy ? 'Sending…' : 'Ask'}
              </button>
            </form>
          </>
        )}
      </div>
    </MissionShell>
  );
};

export default AssistantPage;
