import React from 'react';
import Card from './Card';
import { cn } from '../../lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  helper?: string;
  icon?: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}

const toneStyles: Record<NonNullable<StatCardProps['tone']>, string> = {
  neutral: 'text-white',
  success: 'text-emerald-200',
  warning: 'text-amber-200',
  danger: 'text-rose-200',
  info: 'text-sky-200',
};

const StatCard: React.FC<StatCardProps> = ({ label, value, helper, icon, tone = 'neutral' }) => (
  <Card className="relative overflow-hidden">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--muted)]">{label}</p>
        <p className={cn('mt-3 text-3xl font-semibold', toneStyles[tone])}>{value}</p>
        {helper && <p className="mt-2 text-xs text-[color:var(--muted)]">{helper}</p>}
      </div>
      {icon && (
        <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-white/80">
          {icon}
        </div>
      )}
    </div>
  </Card>
);

export default StatCard;
