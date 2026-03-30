'use client';

import { useState } from 'react';

interface CareerAnalysisFormProps {
  onSubmit: (resumeText: string, domain: string) => Promise<void> | void;
  // This allows both async and sync functions
}

const DOMAINS = [
  'Frontend Development',
  'Backend Development',
  'Full Stack Development',
  'Data Science',
  'Machine Learning',
  'DevOps',
  'Mobile Development',
  'Cloud Architecture',
  'Cybersecurity',
  'Product Management',
  'UI/UX Design',
  'Quality Assurance',
];

export default function CareerAnalysisForm({ onSubmit }: CareerAnalysisFormProps) {
  const [resumeText, setResumeText] = useState('');
  const [domain, setDomain] = useState('');
  const [errors, setErrors] = useState<{ resumeText?: string; domain?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false); // Add loading state

  const validate = () => {
    const newErrors: { resumeText?: string; domain?: string } = {};
    
    if (!resumeText.trim()) {
      newErrors.resumeText = 'Please paste your resume text';
    } else if (resumeText.trim().length < 50) {
      newErrors.resumeText = 'Please provide at least 50 characters of resume text for accurate analysis';
    }
    
    if (!domain) {
      newErrors.domain = 'Please select your target domain';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      try {
        await onSubmit(resumeText, domain);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="card animate-fade-in">
      <h2 className="text-2xl font-semibold mb-6">Career Analysis</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resume / Experience Text
          </label>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume, skills, or experience here..."
            rows={8}
            className={`input-field ${errors.resumeText ? 'border-red-500 focus:ring-red-500' : ''}`}
            disabled={isSubmitting}
          />
          {errors.resumeText && (
            <p className="mt-1 text-sm text-red-600">{errors.resumeText}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            Include your skills, experience, projects, and education for best results
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Domain / Career Path
          </label>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className={`input-field ${errors.domain ? 'border-red-500 focus:ring-red-500' : ''}`}
            disabled={isSubmitting}
          >
            <option value="">Select a domain...</option>
            {DOMAINS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {errors.domain && (
            <p className="mt-1 text-sm text-red-600">{errors.domain}</p>
          )}
        </div>

        <button 
          type="submit" 
          className="btn-primary w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Analyzing...' : 'Analyze My Career Path'}
        </button>
      </form>
    </div>
  );
}