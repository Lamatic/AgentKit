'use client';

interface SkillsDisplayProps {
  skills: string[];
  missingSkills: string[];
}

export default function SkillsDisplay({ skills, missingSkills }: SkillsDisplayProps) {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Skills Analysis</h3>
      
      {skills.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">✓ Your Current Skills</p>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {missingSkills.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">⚠️ Skills to Develop</p>
          <div className="flex flex-wrap gap-2">
            {missingSkills.map((skill, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
          <p className="mt-3 text-sm text-gray-500">
            Focus on developing these skills to improve your career readiness
          </p>
        </div>
      )}
    </div>
  );
}