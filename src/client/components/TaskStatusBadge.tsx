import { HTMLAttributes } from 'react';
import { Badge, BadgeVariant } from './Badge';
import type { TaskStatus } from '@shared/types';

interface TaskStatusBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  status: TaskStatus;
}

const statusVariantMap: Record<TaskStatus, BadgeVariant> = {
  pending: 'warning',
  completed: 'success',
  overdue: 'danger',
  upcoming: 'info',
};

const statusLabelMap: Record<TaskStatus, string> = {
  pending: 'Pending',
  completed: 'Completed',
  overdue: 'Overdue',
  upcoming: 'Upcoming',
};

export function TaskStatusBadge({ status, className = '', ...props }: TaskStatusBadgeProps) {
  return (
    <Badge variant={statusVariantMap[status]} className={className} {...props}>
      {statusLabelMap[status]}
    </Badge>
  );
}
