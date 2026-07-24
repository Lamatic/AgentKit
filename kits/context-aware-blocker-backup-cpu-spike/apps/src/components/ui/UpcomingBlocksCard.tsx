export function UpcomingBlocksCard() {
  return (
    <div className="w-full bg-[#151515] rounded-[32px] p-6 shadow-lg mb-8">
      <div className="flex justify-between items-start mb-1">
         <h2 className="text-2xl font-bold tracking-wide">Upcoming Blocks</h2>
         <span className="material-symbols-outlined text-[#e83a3a] text-[20px]">security</span>
      </div>
      <p className="text-[#94a3b8] text-[15px] mb-6">Start your focus session.</p>
      
      <button className="w-full bg-[#e83a3a] hover:bg-[#f94f4f] transition-colors text-white rounded-full px-6 py-4 flex justify-between items-center shadow-lg">
        <span className="font-bold text-[17px]">Deep Work</span>
        <span className="font-medium text-[15px] opacity-90">Starts in 0h 3m</span>
      </button>
    </div>
  );
}
