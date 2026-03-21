'use client';

import { generatePlan } from '@/actions/orchestrate';
import Content from '@/components/content';
import Loading from '@/components/loading';
import { Plan } from '@/types';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRef } from 'react';

const PlanClient = () => {
  const searchParams = useSearchParams();
  const idea = searchParams.get('idea')!;
  const [isLoading, setIsLoading] = useState(true);
  const [plan, setPlan] = useState<Plan | null>(null);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function getPlan() {
      console.log('Getting plan');
      const plan = await generatePlan(idea);
      setIsLoading(false);

      if (!plan.result) {
        throw new Error('No result');
      }

      setPlan(plan.result.result);
    }

    getPlan();
  }, [idea]);

  return (
    <div className="h-screen max-w-3xl w-3xl mx-auto flex flex-col gap-2 py-4">
      <div className="flex-1 overflow-y-auto">
        {isLoading ? <Loading /> : <Content plan={plan!} />}
      </div>
      <textarea
        placeholder="Enter your idea"
        value={idea}
        disabled
        className="block outline-1 w-full rounded-md h-30 p-3 text-xs resize-none"
      ></textarea>
    </div>
  );
};
export default PlanClient;
