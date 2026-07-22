import React from 'react';
import { Link } from 'react-router-dom';
import ElmCard from '../../design-system/components/ElmCard.tsx';
import type { OutstandingTask } from '../../types/missionControl.ts';

const urgencyLabel: Record<OutstandingTask['urgency'], string> = {
  due_now: 'Due now',
  due_soon: 'Due soon',
  blocked: 'Blocked',
};

const urgencyClass: Record<OutstandingTask['urgency'], string> = {
  due_now: 'mc-task-urgency mc-task-urgency-now',
  due_soon: 'mc-task-urgency mc-task-urgency-soon',
  blocked: 'mc-task-urgency mc-task-urgency-blocked',
};

interface OutstandingTasksProps {
  tasks: OutstandingTask[];
}

const OutstandingTasks: React.FC<OutstandingTasksProps> = ({ tasks }) => (
  <ElmCard variant="default" padding="md" as="section" className="mc-section" aria-label="Outstanding tasks">
    <p className="mc-kicker mb-2">Outstanding tasks</p>
    <h2 className="mc-section-title mb-4">What needs attention</h2>

    {tasks.length === 0 ? (
      <p className="mc-section-copy">No open tasks.</p>
    ) : (
      <ul className="mc-task-list">
        {tasks.map((task) => {
          const body = (
            <>
              <div className="min-w-0 flex-1">
                <p className="mc-task-title">{task.title}</p>
                <p className="mc-task-detail">{task.detail}</p>
              </div>
              <span className={urgencyClass[task.urgency]}>{urgencyLabel[task.urgency]}</span>
            </>
          );

          return (
            <li key={task.id}>
              {task.href ? (
                <Link to={task.href} className="mc-task-row mc-task-row-link">
                  {body}
                </Link>
              ) : (
                <div className="mc-task-row">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    )}
  </ElmCard>
);

export default OutstandingTasks;
