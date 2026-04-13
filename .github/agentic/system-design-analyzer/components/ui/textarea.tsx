'use client';

import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={`flex min-h-[120px] w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-black placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:border-red-600 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${
        className || ''
      }`}
      {...props}
    />
  )
);

Textarea.displayName = 'Textarea';
