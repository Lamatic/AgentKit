'use client';

import { Suspense } from 'react';
import Loading from '@/components/loading';
import PlanClient from './plan-client';

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <PlanClient />
    </Suspense>
  );
}
