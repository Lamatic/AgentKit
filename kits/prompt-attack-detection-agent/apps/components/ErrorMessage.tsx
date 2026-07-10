interface Props {
  message: string;
  onRetry: () => void;
}

/**
 * Displays an error message.
 */
export default function ErrorMessage({
  message,
  onRetry,
}: Props) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <h2 className="text-lg font-bold text-red-700">
        Analysis Failed
      </h2>

      <p className="mt-2 text-red-600">
        {message}
      </p>

      <button
        onClick={onRetry}
        className="mt-5 rounded-lg bg-red-600 px-5 py-2 text-white hover:bg-red-700"
      >
        Try Again
      </button>
    </div>
  );
}