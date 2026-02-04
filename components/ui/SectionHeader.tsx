import React from 'react';
import { cn } from '../../lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, action, className }) => (
  <div className={cn('flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between', className)}>
    <div>
      <h2 className="font-display text-2xl text-white">{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-[color:var(--muted)]">{subtitle}</p>}
    </div>
    {action && <div className="flex flex-wrap gap-2">{action}</div>}
  </div>
);

export default SectionHeader;
