'use client';

import { Lightbulb } from 'lucide-react';

interface RoadmapDisplayProps {
  roadmap: string[];
}

export default function RoadmapDisplay({ roadmap }: RoadmapDisplayProps) {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-primary-600" />
        Your Learning Roadmap
      </h3>
      <div className="space-y-3">
        {roadmap.map((step, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-semibold">
              {idx + 1}
            </div>
            <p className="text-gray-700 flex-1">{step}</p>
          </div>
        ))}
      </div>
      {roadmap.length === 0 && (
        <p className="text-gray-500 text-center py-4">No roadmap steps available</p>
      )}
    </div>
  );
}