import { HTMLAttributes } from 'react';
import { Card, CardHeader, CardBody, CardFooter } from './Card';
import { Button } from './Button';
import { TaskStatusBadge } from './TaskStatusBadge';
import type { Task, TaskType } from '@shared/types';

interface TaskCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  task: Task;
  onComplete?: (taskId: string) => void;
}

const taskTypeLabels: Record<TaskType, string> = {
  contact_patient: 'Contact Patient',
  medication_reconciliation: 'Medication Reconciliation',
  followup_scheduling: 'Confirm Followup Scheduling',
  facility_handoff: 'Facility Handoff Confirmation',
  checkin_call: '48hr Check-in Call',
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function TaskCard({ task, onComplete, className = '', ...props }: TaskCardProps) {
  const isCompletable = task.status === 'pending' || task.status === 'overdue';

  return (
    <Card className={`task-card ${className}`.trim()} {...props}>
      <CardHeader>
        <div className="task-card__header">
          <span className="task-card__type">{taskTypeLabels[task.type]}</span>
          <TaskStatusBadge status={task.status} />
        </div>
      </CardHeader>
      <CardBody>
        <div className="task-card__body">
          <div className="task-card__due">
            <span className="task-card__label">Due:</span>
            <span className="task-card__value">
              {formatDate(task.dueStart)} - {formatDate(task.dueEnd)}
            </span>
          </div>
          {task.completedAt && (
            <div className="task-card__completed">
              <span className="task-card__label">Completed:</span>
              <span className="task-card__value">{formatDate(task.completedAt)}</span>
              {task.completedBy && (
                <span className="task-card__by"> by {task.completedBy}</span>
              )}
            </div>
          )}
          {task.notes && (
            <div className="task-card__notes">
              <span className="task-card__label">Notes:</span>
              <span className="task-card__value">{task.notes}</span>
            </div>
          )}
        </div>
      </CardBody>
      {isCompletable && onComplete && (
        <CardFooter>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onComplete(task.id)}
          >
            Mark Complete
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
