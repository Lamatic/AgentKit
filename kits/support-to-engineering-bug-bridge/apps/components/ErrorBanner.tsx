export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="error-banner" role="alert">
      <span className="error-icon">⚠</span>
      <span className="error-message">{message}</span>
    </div>
  );
}
