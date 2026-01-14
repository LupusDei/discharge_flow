import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskStatusBadge } from './TaskStatusBadge';

describe('TaskStatusBadge', () => {
  it('renders pending status', () => {
    render(<TaskStatusBadge status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders completed status', () => {
    render(<TaskStatusBadge status="completed" />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders overdue status', () => {
    render(<TaskStatusBadge status="overdue" />);
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('renders upcoming status', () => {
    render(<TaskStatusBadge status="upcoming" />);
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
  });

  it('applies warning variant for pending', () => {
    render(<TaskStatusBadge status="pending" data-testid="badge" />);
    expect(screen.getByTestId('badge')).toHaveClass('badge--warning');
  });

  it('applies success variant for completed', () => {
    render(<TaskStatusBadge status="completed" data-testid="badge" />);
    expect(screen.getByTestId('badge')).toHaveClass('badge--success');
  });

  it('applies danger variant for overdue', () => {
    render(<TaskStatusBadge status="overdue" data-testid="badge" />);
    expect(screen.getByTestId('badge')).toHaveClass('badge--danger');
  });

  it('applies info variant for upcoming', () => {
    render(<TaskStatusBadge status="upcoming" data-testid="badge" />);
    expect(screen.getByTestId('badge')).toHaveClass('badge--info');
  });

  it('accepts custom className', () => {
    render(<TaskStatusBadge status="pending" className="custom-class" data-testid="badge" />);
    expect(screen.getByTestId('badge')).toHaveClass('custom-class');
  });
});
