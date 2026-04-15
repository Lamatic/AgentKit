'use client';

import { Rocket } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';

interface ProjectsDisplayProps {
  projects: string[];
}

export default function ProjectsDisplay({ projects }: ProjectsDisplayProps) {
  if (!projects || projects.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-200 p-6">
          <Rocket className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Project Suggestions</h3>
        </div>
        <p className="p-6 text-center text-gray-500">No project suggestions available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-200 p-6">
        <Rocket className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Project Suggestions</h3>
      </div>
      
      <Tabs.Root defaultValue="tab-0" className="p-6">
        <Tabs.List className="mb-4 flex gap-2 border-b border-gray-200">
          {projects.map((_, idx) => (
            <Tabs.Trigger
              key={idx}
              value={`tab-${idx}`}
              className="rounded-t-lg px-4 py-2 text-sm font-medium text-gray-600 transition-all data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 hover:text-gray-900"
            >
              Project {idx + 1}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        
        {projects.map((project, idx) => (
          <Tabs.Content key={idx} value={`tab-${idx}`}>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-6">
              <p className="text-gray-700">{project}</p>
            </div>
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </div>
  );
}