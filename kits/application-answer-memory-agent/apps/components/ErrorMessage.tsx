'use client';

interface ErrorMessageProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="rounded-md border p-4 text-sm border-[#e4b8ab] bg-[#fdf1ec] text-[#8a3a24]">
      <p className="mb-2">{message}</p>
      <button onClick={onRetry} className="font-medium underline">
        Try again
      </button>
    </div>
  );
}
