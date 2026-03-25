'use client';

import { CareerAnalysisOutput } from '@/types';
import SkillsDisplay from './SkillsDisplay';
import RoadmapDisplay from './RoadmapDisplay';
import ProjectsDisplay from './ProjectsDisplay';
import InterviewQuestions from './InterviewQuestions';
import { TrendingUp, Briefcase, Lightbulb } from 'lucide-react';

interface AnalysisResultProps {
  data: CareerAnalysisOutput;
}

export default function AnalysisResult({ data }: AnalysisResultProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLevel = (score: number) => {
    if (score >= 80) return 'Excellent - Ready for opportunities!';
    if (score >= 60) return 'Good - Getting there!';
    if (score >= 40) return 'Fair - Some work needed';
    return 'Needs Improvement - Focus on skill development';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Readiness Score Card */}
      <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              Career Readiness Score
            </h3>
            <p className={`text-4xl font-bold ${getScoreColor(data.readiness_score)}`}>
              {data.readiness_score}/100
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {getScoreLevel(data.readiness_score)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              Based on your current skills vs required skills
            </p>
          </div>
        </div>
      </div>

      {/* Skills Analysis */}
      <SkillsDisplay
        skills={data.skills}
        missingSkills={data.missing_skills}
      />

      {/* Recommended Roles */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary-600" />
          Recommended Job Roles
        </h3>
        <div className="flex flex-wrap gap-2">
          {data.roles.map((role, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
            >
              {role}
            </span>
          ))}
        </div>
      </div>

      {/* Learning Roadmap */}
      <RoadmapDisplay roadmap={data.roadmap} />

      {/* Project Suggestions */}
      <ProjectsDisplay projects={data.projects} />

      {/* Interview Questions */}
      <InterviewQuestions questions={data.interview_questions} />
    </div>
  );
}