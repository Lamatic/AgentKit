const goal = {{triggerNode_1.output.goal}};
const budget = {{triggerNode_1.output.budget}};

if (typeof goal !== 'string' || goal.length < 20 || goal.length > 500) {
  throw new Error('Goal must be a string between 20 and 500 characters');
}

if (typeof budget !== 'number' || budget <= 0) {
  throw new Error('Budget must be a positive number');
}

output = { valid: true, goal: goal, budget: budget };
