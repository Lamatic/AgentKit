export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      <p className="text-gray-600 font-medium">
        Analyzing prompt...
      </p>
    </div>
  );
}