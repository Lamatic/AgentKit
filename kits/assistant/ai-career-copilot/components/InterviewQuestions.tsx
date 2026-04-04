'use client';

import { MessageSquare } from 'lucide-react';
import {
  AccordionRoot,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

interface InterviewQuestionsProps {
  questions: string[];
}

export default function InterviewQuestions({ questions }: InterviewQuestionsProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-200 p-6">
        <MessageSquare className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Interview Questions</h3>
      </div>

      <div className="p-6">
        {questions.length > 0 ? (
          <AccordionRoot type="multiple" className="w-full">
            {questions.map((question, idx) => (
              <AccordionItem
                key={idx}
                value={`question-${idx}`}
                className="border-b border-gray-200 last:border-0"
              >
                <AccordionTrigger className="hover:bg-gray-50 px-4 rounded">
                  <span className="text-left text-gray-900">
                    {idx + 1}. {question}
                  </span>
                </AccordionTrigger>

                <AccordionContent>
                  <div className="pl-8 text-gray-600">
                    <p className="italic">
                      Prepare your answer based on your experience and the job requirements.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </AccordionRoot>
        ) : (
          <p className="py-8 text-center text-gray-500">
            No interview questions available
          </p>
        )}
      </div>
    </div>
  );
}