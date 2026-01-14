import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardBody, CardFooter } from './Card';

describe('Card', () => {
  it('renders children correctly', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies the card class', () => {
    render(<Card data-testid="card">Content</Card>);
    expect(screen.getByTestId('card')).toHaveClass('card');
  });

  it('accepts custom className', () => {
    render(<Card className="custom-class" data-testid="card">Content</Card>);
    expect(screen.getByTestId('card')).toHaveClass('card', 'custom-class');
  });
});

describe('CardHeader', () => {
  it('renders children correctly', () => {
    render(<CardHeader>Header content</CardHeader>);
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  it('applies the card__header class', () => {
    render(<CardHeader data-testid="header">Content</CardHeader>);
    expect(screen.getByTestId('header')).toHaveClass('card__header');
  });
});

describe('CardBody', () => {
  it('renders children correctly', () => {
    render(<CardBody>Body content</CardBody>);
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('applies the card__body class', () => {
    render(<CardBody data-testid="body">Content</CardBody>);
    expect(screen.getByTestId('body')).toHaveClass('card__body');
  });
});

describe('CardFooter', () => {
  it('renders children correctly', () => {
    render(<CardFooter>Footer content</CardFooter>);
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('applies the card__footer class', () => {
    render(<CardFooter data-testid="footer">Content</CardFooter>);
    expect(screen.getByTestId('footer')).toHaveClass('card__footer');
  });
});

describe('Card composition', () => {
  it('renders a full card with header, body, and footer', () => {
    render(
      <Card data-testid="card">
        <CardHeader>Title</CardHeader>
        <CardBody>Content</CardBody>
        <CardFooter>Actions</CardFooter>
      </Card>
    );

    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });
});
