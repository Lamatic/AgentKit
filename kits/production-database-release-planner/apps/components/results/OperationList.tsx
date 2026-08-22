import StatusBadge from "./StatusBadge";

type OperationListProps = {
  items: string[];
  emptyLabel?: string;
};

export default function OperationList({
  items,
  emptyLabel = "None",
}: OperationListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {items.map((item, index) => (
        <div
          key={`${item}-${index}`}
          className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 last:border-b-0"
        >
          <div className="flex items-center gap-3">
            <StatusBadge tone="gray">{index + 1}</StatusBadge>
            <span className="text-sm font-medium text-slate-900">{item}</span>
          </div>
          <span className="code-font text-[11px] text-slate-500">STEP {index + 1}</span>
        </div>
      ))}
    </div>
  );
}