type Props = {
  title: string;
  messages: string[];
};

/** A distinct, explicit error region. Used for validation, engine, and upstream states. */
export function ErrorPanel({ title, messages }: Props) {
  if (messages.length === 0) return null;

  return (
    <div
      role="alert"
      className="space-y-1 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
    >
      <p className="font-semibold">{title}</p>
      <ul className="list-disc space-y-0.5 pl-5">
        {messages.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>
    </div>
  );
}
