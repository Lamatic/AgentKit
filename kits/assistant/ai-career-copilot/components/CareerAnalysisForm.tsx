'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

interface CareerAnalysisFormProps {
  onSubmit: (resumeText: string, domain: string) => Promise<void>;
}

// ✅ Zod schema (validation)
const formSchema = z.object({
  resumeText: z
    .string()
    .min(1, 'Please paste your resume text')
    .min(50, 'Please provide at least 50 characters of resume text for accurate analysis'),
  domain: z.string().min(1, 'Please select your target domain'),
});

type FormData = z.infer<typeof formSchema>;

// Common domains suggestions
const suggestedDomains = [
  'Frontend Development',
  'Backend Development',
  'Full Stack Development',
  'Data Science',
  'Machine Learning',
  'DevOps',
  'Cloud Architecture',
  'Mobile Development',
  'UI/UX Design',
  'Product Management',
  'Cybersecurity',
  'Quality Assurance',
];

export default function CareerAnalysisForm({ onSubmit }: CareerAnalysisFormProps) {
  const [charCount, setCharCount] = useState(0);
  const [selectedSuggestion, setSelectedSuggestion] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      resumeText: '',
      domain: '',
    },
  });

  const resumeTextValue = watch('resumeText');

  const onFormSubmit = async (data: FormData) => {
    await onSubmit(data.resumeText, data.domain);
  };

  const handleDomainSuggestion = (domain: string) => {
    setSelectedSuggestion(domain);
    setValue('domain', domain);
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCharCount(e.target.value.length);
    register('resumeText').onChange(e);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Resume Input */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Resume / Career Summary
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <textarea
            {...register('resumeText')}
            onChange={handleResumeChange}
            placeholder="Paste your resume text here... (minimum 50 characters)"
            rows={8}
            className={`
              w-full px-4 py-3 rounded-lg border-2 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-all duration-200 resize-y
              ${errors.resumeText 
                ? 'border-red-400 bg-red-50' 
                : 'border-gray-300 hover:border-blue-300'
              }
            `}
          />
          {/* Character counter */}
          <div className="absolute bottom-3 right-3 text-xs text-gray-400">
            {charCount}/50+ chars
          </div>
        </div>
        {charCount > 0 && charCount < 50 && (
          <div className="flex items-center gap-2 text-amber-600 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{50 - charCount} more characters needed for best results</span>
          </div>
        )}
        {errors.resumeText && (
          <div className="flex items-center gap-2 text-red-500 text-sm mt-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{errors.resumeText.message}</p>
          </div>
        )}
      </div>

      {/* Domain Input */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Target Domain / Career Path
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div>
          <input
            {...register('domain')}
            placeholder="e.g., Frontend Development, Data Science, Product Management"
            className={`
              w-full px-4 py-3 rounded-lg border-2 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-all duration-200
              ${errors.domain 
                ? 'border-red-400 bg-red-50' 
                : 'border-gray-300 hover:border-blue-300'
              }
            `}
          />
        </div>
        
        {/* Domain suggestions */}
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">Popular domains (click to select):</p>
          <div className="flex flex-wrap gap-2">
            {suggestedDomains.map((domain) => (
              <button
                key={domain}
                type="button"
                onClick={() => handleDomainSuggestion(domain)}
                className={`
                  px-3 py-1 text-sm rounded-full transition-all duration-200
                  ${selectedSuggestion === domain
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                  }
                `}
              >
                {domain}
              </button>
            ))}
          </div>
        </div>
        
        {errors.domain && (
          <div className="flex items-center gap-2 text-red-500 text-sm mt-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{errors.domain.message}</p>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`
            w-full md:w-auto px-8 py-3 rounded-lg font-semibold text-white
            transition-all duration-200 transform
            bg-gradient-to-r from-blue-600 to-blue-700
            hover:from-blue-700 hover:to-blue-800
            focus:outline-none focus:ring-4 focus:ring-blue-300
            disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
            shadow-md hover:shadow-lg
          `}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing your career path...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Analyze Career Path
            </span>
          )}
        </button>
        
        {/* Help text */}
        <p className="text-xs text-gray-400 mt-3">
          Your resume text is processed securely and will not be stored permanently
        </p>
      </div>
    </form>
  );
}