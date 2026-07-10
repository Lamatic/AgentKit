interface Props {
  severity: string;
}

export default function RiskBadge({
  severity,
}: Props) {

  const color =
    severity.toLowerCase() === "high"
      ? "bg-red-100 text-red-700"
      : severity.toLowerCase() === "medium"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-green-100 text-green-700";

  return (
    <span
      className={`rounded-full px-4 py-2 font-semibold ${color}`}
    >
      {severity}
    </span>
  );
}