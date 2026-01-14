import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from './TaskCard';
import type { Task } from '@shared/types';

const baseTask: Task = {
  id: 'task-1',
  patientId: 'patient-1',
  type: 'contact_patient',
  status: 'pending',
  dueStart: new Date('2024-01-15T09:00:00'),
  dueEnd: new Date('2024-01-15T17:00:00'),
};

describe('TaskCard', () => {
  it('renders task type label', () => {
    render(<TaskCard task={baseTask} />);
    expect(screen.getByText('Contact Patient')).toBeInTheDocument();
  });

  it('renders task status badge', () => {
    render(<TaskCard task={baseTask} />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders due date range', () => {
    render(<TaskCard task={baseTask} />);
    expect(screen.getByText('Due:')).toBeInTheDocument();
  });

  it('renders medication reconciliation type', () => {
    const task: Task = { ...baseTask, type: 'medication_reconciliation' };
    render(<TaskCard task={task} />);
    expect(screen.getByText('Medication Reconciliation')).toBeInTheDocument();
  });

  it('renders followup scheduling type', () => {
    const task: Task = { ...baseTask, type: 'followup_scheduling' };
    render(<TaskCard task={task} />);
    expect(screen.getByText('Confirm Followup Scheduling')).toBeInTheDocument();
  });

  it('renders facility handoff type', () => {
    const task: Task = { ...baseTask, type: 'facility_handoff' };
    render(<TaskCard task={task} />);
    expect(screen.getByText('Facility Handoff Confirmation')).toBeInTheDocument();
  });

  it('renders checkin call type', () => {
    const task: Task = { ...baseTask, type: 'checkin_call' };
    render(<TaskCard task={task} />);
    expect(screen.getByText('48hr Check-in Call')).toBeInTheDocument();
  });

  it('shows complete button for pending tasks', () => {
    const onComplete = vi.fn();
    render(<TaskCard task={baseTask} onComplete={onComplete} />);
    expect(screen.getByRole('button', { name: 'Mark Complete' })).toBeInTheDocument();
  });

  it('shows complete button for overdue tasks', () => {
    const task: Task = { ...baseTask, status: 'overdue' };
    const onComplete = vi.fn();
    render(<TaskCard task={task} onComplete={onComplete} />);
    expect(screen.getByRole('button', { name: 'Mark Complete' })).toBeInTheDocument();
  });

  it('does not show complete button for completed tasks', () => {
    const task: Task = { ...baseTask, status: 'completed' };
    const onComplete = vi.fn();
    render(<TaskCard task={task} onComplete={onComplete} />);
    expect(screen.queryByRole('button', { name: 'Mark Complete' })).not.toBeInTheDocument();
  });

  it('does not show complete button for upcoming tasks', () => {
    const task: Task = { ...baseTask, status: 'upcoming' };
    const onComplete = vi.fn();
    render(<TaskCard task={task} onComplete={onComplete} />);
    expect(screen.queryByRole('button', { name: 'Mark Complete' })).not.toBeInTheDocument();
  });

  it('calls onComplete with task id when button is clicked', () => {
    const onComplete = vi.fn();
    render(<TaskCard task={baseTask} onComplete={onComplete} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mark Complete' }));
    expect(onComplete).toHaveBeenCalledWith('task-1');
  });

  it('shows completed info when task is completed', () => {
    const task: Task = {
      ...baseTask,
      status: 'completed',
      completedAt: new Date('2024-01-15T14:30:00'),
      completedBy: 'John Doe',
    };
    render(<TaskCard task={task} />);
    expect(screen.getByText('Completed:')).toBeInTheDocument();
    expect(screen.getByText(/by John Doe/)).toBeInTheDocument();
  });

  it('shows notes when present', () => {
    const task: Task = { ...baseTask, notes: 'Called patient, left voicemail' };
    render(<TaskCard task={task} />);
    expect(screen.getByText('Notes:')).toBeInTheDocument();
    expect(screen.getByText('Called patient, left voicemail')).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    render(<TaskCard task={baseTask} className="custom-class" data-testid="task-card" />);
    expect(screen.getByTestId('task-card')).toHaveClass('task-card', 'custom-class');
  });
});
