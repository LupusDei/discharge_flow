import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders children correctly', () => {
    render(<Badge>Status</Badge>);
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('applies default variant by default', () => {
    render(<Badge data-testid="badge">Default</Badge>);
    expect(screen.getByTestId('badge')).toHaveClass('badge--default');
  });

  it('applies success variant', () => {
    render(<Badge variant="success" data-testid="badge">Success</Badge>);
    expect(screen.getByTestId('badge')).toHaveClass('badge--success');
  });

  it('applies warning variant', () => {
    render(<Badge variant="warning" data-testid="badge">Warning</Badge>);
    expect(screen.getByTestId('badge')).toHaveClass('badge--warning');
  });

  it('applies danger variant', () => {
    render(<Badge variant="danger" data-testid="badge">Danger</Badge>);
    expect(screen.getByTestId('badge')).toHaveClass('badge--danger');
  });

  it('applies info variant', () => {
    render(<Badge variant="info" data-testid="badge">Info</Badge>);
    expect(screen.getByTestId('badge')).toHaveClass('badge--info');
  });

  it('applies the base badge class', () => {
    render(<Badge data-testid="badge">Test</Badge>);
    expect(screen.getByTestId('badge')).toHaveClass('badge');
  });

  it('accepts custom className', () => {
    render(<Badge className="custom-class" data-testid="badge">Test</Badge>);
    expect(screen.getByTestId('badge')).toHaveClass('badge', 'custom-class');
  });

  it('passes through additional props', () => {
    render(<Badge title="Badge title">Test</Badge>);
    expect(screen.getByTitle('Badge title')).toBeInTheDocument();
  });
});
