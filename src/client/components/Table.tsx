import { TableHTMLAttributes, HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes, ReactNode } from 'react';

interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

export function Table({ children, className = '', ...props }: TableProps) {
  return (
    <table className={`table ${className}`.trim()} {...props}>
      {children}
    </table>
  );
}

interface TableHeadProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export function TableHead({ children, className = '', ...props }: TableHeadProps) {
  return (
    <thead className={`table__head ${className}`.trim()} {...props}>
      {children}
    </thead>
  );
}

interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export function TableBody({ children, className = '', ...props }: TableBodyProps) {
  return (
    <tbody className={`table__body ${className}`.trim()} {...props}>
      {children}
    </tbody>
  );
}

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
}

export function TableRow({ children, className = '', ...props }: TableRowProps) {
  return (
    <tr className={`table__row ${className}`.trim()} {...props}>
      {children}
    </tr>
  );
}

interface TableHeaderProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
}

export function TableHeader({ children, className = '', ...props }: TableHeaderProps) {
  return (
    <th className={`table__header ${className}`.trim()} {...props}>
      {children}
    </th>
  );
}

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
}

export function TableCell({ children, className = '', ...props }: TableCellProps) {
  return (
    <td className={`table__cell ${className}`.trim()} {...props}>
      {children}
    </td>
  );
}
