import { useCommitStore } from "@/hooks/useCommitStore";

export function UpcomingBlocksCard() {
  const { commits } = useCommitStore();
  const activeCount = commits.length;

  return (
    <div className="w-full bg-surface rounded-[32px] p-6 shadow-lg mb-8">
      <div className="flex justify-between items-start mb-1">
         <h2 className="text-2xl font-bold tracking-wide">Blocks Overview</h2>
      </div>
      <p className="text-muted text-[15px] mb-6">Manage your focus sessions.</p>
      
      <button className="w-full bg-background text-muted rounded-full px-6 py-4 flex justify-between items-center shadow-sm cursor-default">
        <span className="font-bold text-[17px]">{activeCount} block{activeCount === 1 ? '' : 's'} configured</span>
      </button>
    </div>
  );
}
