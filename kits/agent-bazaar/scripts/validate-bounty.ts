const goal = {{triggerNode_1.output.goal}};
const budget = {{triggerNode_1.output.budget}};

const trimmedGoal = typeof goal === 'string' ? goal.trim() : goal;

if (typeof trimmedGoal !== 'string' || trimmedGoal.length < 20 || trimmedGoal.length > 500) {
  throw new Error('Goal must be a string between 20 and 500 characters');
}

if (typeof budget !== 'number' || budget <= 0) {
  throw new Error('Budget must be a positive number');
}

output = { valid: true, goal: trimmedGoal, budget: budget };
