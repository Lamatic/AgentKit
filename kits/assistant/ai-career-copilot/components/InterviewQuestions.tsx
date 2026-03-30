'use client';

import { HelpCircle } from 'lucide-react';

interface InterviewQuestionsProps {
  questions: string[];
}

export default function InterviewQuestions({ questions }: InterviewQuestionsProps) {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-blue-600" />
        Interview Questions to Practice
      </h3>
      <div className="space-y-3">
        {questions.map((question, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-semibold">
              {idx + 1}
            </span>
            <p className="text-gray-700">{question}</p>
          </div>
        ))}
      </div>
      {questions.length === 0 && (
        <p className="text-gray-500 text-center py-4">No interview questions available</p>
      )}
    </div>
  );
}