import React from 'react';
import ElmCard from '../../design-system/components/ElmCard.tsx';
import type { OutstandingTask } from '../../types/missionControl.ts';
import type { SubmissionType } from '../../types/submission.ts';

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
  onActivateTask?: (target: {
    submissionType: SubmissionType;
    href: string;
  }) => void;
}

const OutstandingTasks: React.FC<OutstandingTasksProps> = ({ tasks, onActivateTask }) => (
  <ElmCard variant="default" padding="md" as="section" className="mc-section" aria-label="Open tasks">
    <p className="mc-kicker mb-2">Outstanding tasks</p>
    <h2 className="mc-section-title mb-4">Open tasks</h2>

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

          const { href, submissionType } = task;
          const canActivate = Boolean(href && submissionType && onActivateTask);

          return (
            <li key={task.id}>
              {canActivate && href && submissionType && onActivateTask ? (
                <button
                  type="button"
                  className="mc-task-row mc-task-row-link"
                  onClick={() =>
                    onActivateTask({
                      submissionType,
                      href,
                    })
                  }
                >
                  {body}
                </button>
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
