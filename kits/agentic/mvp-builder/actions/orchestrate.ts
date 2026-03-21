'use server';

import { lamaticClient } from '@/lib/lamatic-client';
import { config } from '@/orchestrate';
import { LamaticResponse } from 'lamatic/dist/types';

export async function generatePlan(idea: string): Promise<LamaticResponse> {
  const flow = config.flows.mvp;

  if (!flow.workflowId) {
    throw new Error('Workflow ID missing');
  }

  const inputs = {
    idea
  };

  const res = await lamaticClient.executeFlow(flow.workflowId, inputs);

  if (!res) {
    throw new Error('No output from flow');
  }

  return res;
}
