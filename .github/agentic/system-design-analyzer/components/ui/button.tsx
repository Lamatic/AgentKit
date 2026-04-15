'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const baseClass =
      'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      default: 'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl',
      outline: 'border border-black bg-white text-black hover:bg-gray-100 hover:border-red-600',
      ghost: 'text-black hover:bg-gray-100 hover:text-red-600',
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
