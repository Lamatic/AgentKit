'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const Page = () => {
  const prompts = [
    'Build a platform where people can rent out unused household items like tools, cameras, and furniture',
    'Build an AI-powered app that converts meeting recordings into structured notes, action items, and summaries',
    'Build a tool that analyzes a GitHub repository and generates onboarding docs, architecture diagrams, and references',
    'Build a mobile app that helps users track daily habits with streaks, reminders, and gamification'
  ];
  const [input, setInput] = useState('');
  const router = useRouter();

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    if (input.trim().length === 0) return;

    router.push(`/plan?idea=${encodeURIComponent(input)}`);
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="flex flex-col gap-2 max-w-2xl mx-auto">
        <h1 className="text-5xl text-center">Plan your MVP from idea in seconds</h1>
        <form onSubmit={handleSubmit}>
          <textarea
            placeholder="Enter your idea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="outline-1 w-full rounded-md h-30 p-3 text-xs my-4 resize-none"
          ></textarea>
          <Button className="cursor-pointer w-full" type="submit">
            Plan
          </Button>
        </form>
        <div className="*:text-xs space-y-4 *:cursor-pointer">
          {prompts.map((prompt) => (
            <Button variant={'outline'} onClick={() => setInput(prompt)} key={prompt}>
              {prompt}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
export default Page;
