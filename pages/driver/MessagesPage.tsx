import React, { useEffect, useMemo, useState } from 'react';
import MissionShell from '../../components/mission-control/MissionShell.tsx';
import EmptyState from '../../design-system/components/EmptyState.tsx';
import { useDriverExperience } from '../../context/DriverExperienceContext.tsx';
import type { MessageCategory, MessageItem } from '../../services/dataSource/types.ts';

const CATEGORY_LABEL: Record<MessageCategory, string> = {
  dispatch: 'Dispatch',
  payroll: 'Payroll',
  safety: 'Safety',
  maintenance: 'Maintenance',
  announcement: 'Announcements',
};

function priorityTone(m: MessageItem): 'ok' | 'info' | 'warning' | 'critical' {
  if (m.priority === 'urgent') return 'critical';
  if (m.priority === 'high') return 'warning';
  return 'info';
}

/** Messages — production polite empty state / Showcase rich inbox with categories and ack simulation. */
const MessagesPage: React.FC = () => {
  const { mode, dataSource, actions } = useDriverExperience();
  const messages = dataSource.getMessages();
  const [category, setCategory] = useState<MessageCategory | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const categories = useMemo(() => {
    const set = new Set<MessageCategory>();
    messages.forEach((m) => m.category && set.add(m.category));
    return Array.from(set);
  }, [messages]);

  const filtered = useMemo(
    () => (category === 'all' ? messages : messages.filter((m) => m.category === category)),
    [messages, category]
  );

  useEffect(() => {
    if (!filtered.some((m) => m.id === selectedId)) {
      setSelectedId(filtered[0]?.id ?? null);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((m) => m.id === selectedId) || null;
  const unreadCount = messages.filter((m) => m.unread).length;

  const runAck = async (messageId: string, verb: string) => {
    if (!actions.acknowledgeMessage) return;
    const result = await actions.acknowledgeMessage(messageId);
    setStatus(`${result.disclosure}: ${verb === 'reply' ? 'Reply' : 'Acknowledgement'} recorded — ${result.message}`);
  };

  return (
    <MissionShell title="Messages" activeNav="more">
      <div className="space-y-6">
        <header>
          <p className="mc-kicker">Messages</p>
          <h1 className="mc-page-title">Inbox</h1>
          <p className="mc-section-copy">
            {mode === 'showcase'
              ? `Demonstration data only — ${unreadCount} unread. Nothing here reaches a real dispatch, payroll, or safety inbox.`
              : 'Dispatch, payroll, and safety messages will appear here when messaging is connected.'}
          </p>
        </header>

        {messages.length === 0 ? (
          <EmptyState
            kicker="Inbox"
            title="No messages yet"
            description="Dispatch, payroll, and safety messages will show up here once messaging service is connected."
          />
        ) : (
          <>
            <div className="mc-filter-tabs" role="tablist" aria-label="Message category">
              <button
                type="button"
                role="tab"
                aria-selected={category === 'all'}
                className={`mc-filter-tab${category === 'all' ? ' is-active' : ''}`}
                onClick={() => setCategory('all')}
              >
                All
                <span className="mc-filter-tab-count">{messages.length}</span>
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="tab"
                  aria-selected={category === c}
                  className={`mc-filter-tab${category === c ? ' is-active' : ''}`}
                  onClick={() => setCategory(c)}
                >
                  {CATEGORY_LABEL[c]}
                  <span className="mc-filter-tab-count">
                    {messages.filter((m) => m.category === c).length}
                  </span>
                </button>
              ))}
            </div>

            <div className="mc-inbox-layout">
              <ul className="mc-inbox-list">
                {filtered.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      className={`mc-inbox-row${selectedId === m.id ? ' is-selected' : ''}${
                        m.unread ? ' is-unread' : ''
                      }`}
                      onClick={() => setSelectedId(m.id)}
                      aria-pressed={selectedId === m.id}
                    >
                      <div className="flex justify-between gap-2">
                        <p className="mc-inbox-row-title">
                          {m.unread ? <span className="mc-inbox-unread-dot" aria-hidden /> : null}
                          {m.subject}
                        </p>
                        <span className={`mc-status-badge mc-status-badge--${priorityTone(m)}`}>
                          {m.priority || 'normal'}
                        </span>
                      </div>
                      <p className="mc-inbox-row-preview">{m.from}</p>
                      <p className="mc-inbox-row-preview">{m.preview}</p>
                      {m.ackRequired ? (
                        <span className="mc-status-badge mc-status-badge--warning mt-2 inline-flex">
                          Acknowledgement requested
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>

              {selected ? (
                <div className="mc-load-detail space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="mc-kicker mb-0">{selected.from}</p>
                      <h2 className="mc-section-title">{selected.subject}</h2>
                    </div>
                    <span className="mc-capability-chip">{selected.disclosure}</span>
                  </div>
                  <p className="mc-section-copy">{selected.body || selected.preview}</p>

                  <dl className="mc-meta-grid">
                    {selected.relatedLoadNum ? (
                      <div>
                        <dt>Related trip</dt>
                        <dd>#{selected.relatedLoadNum}</dd>
                      </div>
                    ) : null}
                    {selected.relatedEquipment ? (
                      <div>
                        <dt>Related vehicle</dt>
                        <dd>{selected.relatedEquipment}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt>Category</dt>
                      <dd>{selected.category ? CATEGORY_LABEL[selected.category] : '—'}</dd>
                    </div>
                    <div>
                      <dt>Attachment</dt>
                      <dd>{selected.hasAttachment ? 'Yes (demo)' : 'None'}</dd>
                    </div>
                  </dl>

                  {status ? (
                    <p className="text-xs text-amber-300 normal-case" role="status">
                      {status}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    {selected.ackRequired ? (
                      <button
                        type="button"
                        className="mc-exception-action"
                        onClick={() => runAck(selected.id, 'ack')}
                      >
                        Acknowledge (demo)
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="mc-exception-action"
                      style={{ background: 'transparent' }}
                      onClick={() => runAck(selected.id, 'reply')}
                    >
                      Simulate reply
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </MissionShell>
  );
};

export default MessagesPage;
