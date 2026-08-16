const task = {{triggerNode_1.output.task}};
const members = {{triggerNode_1.output.members}};

const requiredSkills = Array.isArray(task.requiredSkills) ? task.requiredSkills.map((value) => String(value).toLowerCase()) : [];
const highRisk = /security|authentication|authorization|payment|architecture|permissions/i.test(`${task.title || ""} ${task.description || ""}`);
const complexity = String(task.complexity || "STANDARD").toUpperCase();
const priority = String(task.priority || "MEDIUM").toUpperCase();

const scored = (Array.isArray(members) ? members : []).map((member) => {
  const role = String(member.role || "").toUpperCase();
  const skills = Array.isArray(member.skills) ? member.skills.map((value) => String(value).toLowerCase()) : [];
  const matches = requiredSkills.filter((skill) => skills.includes(skill)).length;
  const skillMatch = requiredSkills.length ? Math.round((matches / requiredSkills.length) * 40) : 20;
  const seniorRole = role === "TEAM_LEAD" || role === "SENIOR_DEVELOPER";
  const juniorRole = role === "JUNIOR_DEVELOPER" || role === "INTERN";
  const roleFit = complexity === "COMPLEX" ? (seniorRole ? 25 : 8) : complexity === "SIMPLE" ? (juniorRole ? 25 : 18) : (role === "INTERN" ? 12 : 22);
  const openTasks = Number(member.currentOpenTasks);
  const highTasks = Number(member.currentHighPriorityTasks);
  const invalidWorkload = !Number.isFinite(openTasks) || !Number.isFinite(highTasks) || openTasks < 0 || highTasks < 0;
  const capacity = invalidWorkload ? 0 : Math.max(0, Math.min(20, 20 - openTasks * 3 - highTasks * 4));
  const dependencyFit = task.dependencyOwnerId && String(task.dependencyOwnerId) === String(member.memberId) ? 10 : 5;
  const priorityFit = priority === "CRITICAL" || priority === "HIGH" ? (seniorRole ? 5 : 2) : 5;
  const disqualified = invalidWorkload || (highRisk && role === "INTERN");
  const breakdown = { skillMatch, roleFit, capacity, dependencyFit, priorityFit };
  return {
    memberId: member.memberId,
    name: member.name,
    role,
    disqualified,
    score: disqualified ? 0 : Object.values(breakdown).reduce((sum, value) => sum + value, 0),
    breakdown,
    ...(invalidWorkload ? { reason: "Invalid workload data" } : {})
  };
}).sort((a, b) => b.score - a.score);

const qualified = scored.filter((candidate) => !candidate.disqualified);
output = {
  taskId: task.id,
  recommended: qualified[0] || null,
  alternatives: qualified.slice(1, 4),
  excluded: scored.filter((candidate) => candidate.disqualified),
  requiresApproval: true
};
