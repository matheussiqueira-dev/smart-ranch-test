import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-[color:var(--accent)] text-black hover:opacity-90',
  secondary: 'border border-white/10 bg-white/10 text-white hover:border-white/30',
  ghost: 'border border-white/5 text-white/70 hover:text-white hover:border-white/20',
};

const Button: React.FC<ButtonProps> = ({ variant = 'secondary', className, ...props }) => (
  <button
    {...props}
    className={cn(
      'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:opacity-60',
      variantStyles[variant],
      className,
    )}
  />
);

export default Button;
