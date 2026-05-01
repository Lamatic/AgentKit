'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={`flex h-10 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base text-black placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:border-red-600 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${
        className || ''
      }`}
      ref={ref}
      {...props}
    />
  )
);

Input.displayName = 'Input';
