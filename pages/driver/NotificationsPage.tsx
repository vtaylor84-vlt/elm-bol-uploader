import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MissionShell from '../../components/mission-control/MissionShell.tsx';
import EmptyState from '../../design-system/components/EmptyState.tsx';
import { useDriverExperience } from '../../context/DriverExperienceContext.tsx';
import type { NotificationPriority } from '../../services/dataSource/types.ts';

const priorityTone: Record<NotificationPriority, 'ok' | 'info' | 'warning' | 'critical'> = {
  critical: 'critical',
  action: 'warning',
  info: 'info',
};

/** Notifications — priority + read state list. Showcase-first; production shows a polite empty state. */
const NotificationsPage: React.FC = () => {
  const { mode, dataSource, actions } = useDriverExperience();
  const notifications = dataSource.getNotifications?.() ?? [];
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const markRead = async (id: string) => {
    setReadIds((prev) => new Set(prev).add(id));
    await actions.markNotificationRead?.(id);
  };

  const unreadCount = notifications.filter((n) => n.unread && !readIds.has(n.id)).length;

  return (
    <MissionShell title="Notifications" activeNav="more">
      <div className="space-y-6">
        <header>
          <p className="mc-kicker">Notifications</p>
          <h1 className="mc-page-title">Alert center</h1>
          <p className="mc-section-copy">
            {mode === 'showcase'
              ? `Demonstration data only — ${unreadCount} unread.`
              : 'Alerts about loads, documents, and payroll will appear here when notifications are connected.'}
          </p>
        </header>

        {notifications.length === 0 ? (
          <EmptyState
            kicker="Alerts"
            title="No notifications yet"
            description="Load, document, and payroll alerts will show up here once notifications are connected."
          />
        ) : (
          <ul className="mc-task-list">
            {notifications.map((n) => {
              const isRead = !n.unread || readIds.has(n.id);
              return (
                <li key={n.id} className="mc-task-row items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {!isRead ? <span className="mc-inbox-unread-dot" aria-hidden /> : null}
                      <p className="mc-task-title">{n.title}</p>
                      <span className={`mc-status-badge mc-status-badge--${priorityTone[n.priority]}`}>
                        {n.priority}
                      </span>
                    </div>
                    <p className="mc-task-detail">{n.detail}</p>
                    <p className="mc-task-detail text-zinc-600">{n.whenLabel}</p>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {n.href ? (
                        <Link to={n.href} className="text-cyan-400 text-xs no-underline">
                          Open
                        </Link>
                      ) : null}
                      {!isRead ? (
                        <button
                          type="button"
                          className="text-zinc-400 text-xs underline"
                          onClick={() => markRead(n.id)}
                        >
                          Mark read
                        </button>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </MissionShell>
  );
};

export default NotificationsPage;
