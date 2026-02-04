import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}

const toneStyles: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'border-white/10 bg-white/10 text-white/70',
  success: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-100',
  warning: 'border-amber-400/30 bg-amber-500/15 text-amber-100',
  danger: 'border-rose-400/30 bg-rose-500/15 text-rose-100',
  info: 'border-sky-400/30 bg-sky-500/15 text-sky-100',
};

const Badge: React.FC<BadgeProps> = ({ children, className, tone = 'neutral' }) => (
  <span
    className={cn(
      'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.25em]',
      toneStyles[tone],
      className,
    )}
  >
    {children}
  </span>
);

export default Badge;
