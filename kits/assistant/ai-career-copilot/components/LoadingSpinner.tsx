'use client';

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-gray-600 animate-pulse">
        Analyzing your career path...
      </p>
      <p className="text-sm text-gray-500">
        Our AI is analyzing your skills and generating personalized recommendations
      </p>
    </div>
  );
}