'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const baseClass =
      'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
    };

    const sizes = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-8 text-base',
    };

    return (
      <button
        className={`${baseClass} ${variants[variant]} ${sizes[size]} ${className || ''}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
