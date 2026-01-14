import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from './Table';

describe('Table', () => {
  it('renders children correctly', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Cell content</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByText('Cell content')).toBeInTheDocument();
  });

  it('applies the table class', () => {
    render(
      <Table data-testid="table">
        <TableBody>
          <TableRow>
            <TableCell>Content</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByTestId('table')).toHaveClass('table');
  });
});

describe('TableHead', () => {
  it('renders header row correctly', () => {
    render(
      <Table>
        <TableHead data-testid="thead">
          <TableRow>
            <TableHeader>Header</TableHeader>
          </TableRow>
        </TableHead>
      </Table>
    );
    expect(screen.getByTestId('thead')).toHaveClass('table__head');
  });
});

describe('TableBody', () => {
  it('renders body correctly', () => {
    render(
      <Table>
        <TableBody data-testid="tbody">
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByTestId('tbody')).toHaveClass('table__body');
  });
});

describe('TableRow', () => {
  it('renders row correctly', () => {
    render(
      <Table>
        <TableBody>
          <TableRow data-testid="row">
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByTestId('row')).toHaveClass('table__row');
  });
});

describe('TableHeader', () => {
  it('renders header cell correctly', () => {
    render(
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader data-testid="th">Header Cell</TableHeader>
          </TableRow>
        </TableHead>
      </Table>
    );
    expect(screen.getByTestId('th')).toHaveClass('table__header');
    expect(screen.getByText('Header Cell')).toBeInTheDocument();
  });
});

describe('TableCell', () => {
  it('renders cell correctly', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell data-testid="td">Cell Content</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByTestId('td')).toHaveClass('table__cell');
    expect(screen.getByText('Cell Content')).toBeInTheDocument();
  });
});

describe('Table composition', () => {
  it('renders a complete table structure', () => {
    render(
      <Table data-testid="table">
        <TableHead>
          <TableRow>
            <TableHeader>Name</TableHeader>
            <TableHeader>Status</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>John</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Jane</TableCell>
            <TableCell>Pending</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByTestId('table')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});
