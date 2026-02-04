import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'soft' | 'ghost';
}

const variantStyles: Record<NonNullable<CardProps['variant']>, string> = {
  default: 'bg-[color:var(--surface)]/90 border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.25)]',
  soft: 'bg-[color:var(--surface-2)]/70 border-white/10',
  ghost: 'bg-transparent border-white/5',
};

const Card: React.FC<CardProps> = ({ children, className, variant = 'default' }) => (
  <section className={cn('rounded-3xl border p-6 backdrop-blur', variantStyles[variant], className)}>
    {children}
  </section>
);

export default Card;
