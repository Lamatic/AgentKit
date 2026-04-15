'use client';

export default function LoadingSpinner() {
  return (
    <div 
      role="status" 
      aria-live="polite"
      className="flex flex-col items-center justify-center space-y-4"
    >
      {/* Visually hidden announcement for screen readers */}
      <span className="sr-only">
        Loading: Analyzing your career path. Our AI is processing your resume and generating personalized recommendations.
      </span>
      
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-gray-600 animate-pulse" aria-hidden="true">
        Analyzing your career path...
      </p>
      <p className="text-sm text-gray-500" aria-hidden="true">
        Our AI is analyzing your skills and generating personalized recommendations
      </p>
    </div>
  );
}