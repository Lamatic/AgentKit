'use client';

import { Lightbulb } from 'lucide-react';
import * as Accordion from '@radix-ui/react-accordion';
import * as Separator from '@radix-ui/react-separator';
import { forwardRef } from 'react';

interface RoadmapDisplayProps {
  roadmap: string[];
}

const AccordionTrigger = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ children, className, ...props }, ref) => (
    <Accordion.Header className="flex">
      <Accordion.Trigger
        ref={ref}
        className={`group flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180 ${className}`}
        {...props}
      >
        {children}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          className="h-4 w-4 shrink-0 transition-transform duration-200"
        >
          <path
            d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.5648L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35948 12.0434 6.6759 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.6759 2.94637 6.35948 3.13523 6.15803Z"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
          />
        </svg>
      </Accordion.Trigger>
    </Accordion.Header>
  )
);
AccordionTrigger.displayName = 'AccordionTrigger';

const AccordionContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <Accordion.Content
      ref={ref}
      className={`overflow-hidden text-sm data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown ${className}`}
      {...props}
    >
      <div className="pb-4 pt-0">{children}</div>
    </Accordion.Content>
  )
);
AccordionContent.displayName = 'AccordionContent';

export default function RoadmapDisplay({ roadmap }: RoadmapDisplayProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-200 p-6">
        <Lightbulb className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Your Learning Roadmap</h3>
      </div>
      
      <div className="p-6">
        {roadmap.length > 0 ? (
          <Accordion.Root type="single" collapsible className="w-full">
            {roadmap.map((step, idx) => (
              <Accordion.Item key={idx} value={`step-${idx}`} className="border-b border-gray-200 last:border-0">
                <AccordionTrigger className="hover:bg-gray-50 px-4 rounded">
                  <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                      {idx + 1}
                    </div>
                    <span className="text-gray-900">Step {idx + 1}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-9 text-gray-700">{step}</div>
                </AccordionContent>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        ) : (
          <p className="py-8 text-center text-gray-500">No roadmap steps available</p>
        )}
      </div>
    </div>
  );
}