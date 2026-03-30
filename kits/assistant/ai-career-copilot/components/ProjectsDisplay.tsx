'use client';

import { Code2 } from 'lucide-react';

interface ProjectsDisplayProps {
  projects: string[];
}

export default function ProjectsDisplay({ projects }: ProjectsDisplayProps) {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Code2 className="w-5 h-5 text-blue-600" />
        Recommended Projects
      </h3>
      <div className="space-y-3">
        {projects.map((project, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2" />
            <p className="text-gray-700">{project}</p>
          </div>
        ))}
      </div>
      {projects.length === 0 && (
        <p className="text-gray-500 text-center py-4">No project suggestions available</p>
      )}
    </div>
  );
}