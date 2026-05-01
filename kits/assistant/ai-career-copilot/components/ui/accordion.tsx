'use client';

import * as Accordion from '@radix-ui/react-accordion';
import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

// Re-export base components
export const AccordionRoot = Accordion.Root;
export const AccordionItem = Accordion.Item;

// Trigger
export const AccordionTrigger = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, className = '', ...props }, ref) => (
  <Accordion.Header className="flex">
    <Accordion.Trigger
      ref={ref}
      className={`group flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180 ${className}`}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </Accordion.Trigger>
  </Accordion.Header>
));
AccordionTrigger.displayName = 'AccordionTrigger';

// Content
export const AccordionContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className = '', ...props }, ref) => (
  <Accordion.Content
    ref={ref}
    className={`overflow-hidden text-sm data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown ${className}`}
    {...props}
  >
    <div className="pb-4 pt-0">{children}</div>
  </Accordion.Content>
));
AccordionContent.displayName = 'AccordionContent';