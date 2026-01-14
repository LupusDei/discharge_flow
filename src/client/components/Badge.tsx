import { HTMLAttributes, ReactNode } from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

export function Badge({
  variant = 'default',
  children,
  className = '',
  ...props
}: BadgeProps) {
  const baseClasses = 'badge';
  const variantClass = `badge--${variant}`;

  return (
    <span className={`${baseClasses} ${variantClass} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}
