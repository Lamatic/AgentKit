const resume_text = {{triggerNode_1.output.resume_text}};
const domain = {{triggerNode_1.output.domain}};

const inputText = (resume_text || "").toLowerCase();

// Skill database
const skillDatabase = [
  "html", "css", "javascript", "react", "node.js",
  "mongodb", "sql", "python", "java",
  "communication", "teamwork", "problem solving"
];

// Function for exact word match
const hasSkill = (text, skill) => {
  const regex = new RegExp(`\\b${skill}\\b`, "i");
  return regex.test(text);
};

// Extract skills safely
const extractedSkills = skillDatabase.filter(skill => {
  return hasSkill(inputText, skill);
});

return {
  skills: extractedSkills,
  domain: domain
};