import { cn } from "@/lib/utils";

interface CommitCardProps {
  title?: string;
  iconName?: string;
  showRisk?: boolean;
  hasTime?: boolean;
  hasBlock?: boolean;
  hasAI?: boolean;
  onTimeClick?: () => void;
}

export function CommitCard({
  title = "Focus",
  iconName = "menu_book",
  showRisk = false,
  hasTime = true,
  hasBlock = true,
  hasAI = true,
  onTimeClick,
}: CommitCardProps) {
  const getIconColor = (isActive: boolean) => isActive ? 'text-[#e83a3a]' : 'text-white/10';

  return (
    <div className="w-full bg-[#151515] rounded-[32px] cursor-pointer shadow-lg hover:bg-[#1f1f1f] transition-colors px-5 py-6">
      
      {/* Top Row: Skull | Icon+Title | Dots */}
      <div className="flex items-start">
        
        {/* Left: Skull */}
        <div className="w-10 shrink-0">
          <span className={cn("material-symbols-outlined !text-[22px] leading-none", showRisk ? 'text-[#e83a3a]' : 'text-white/10')}>
            skull
          </span>
        </div>

        {/* Center: Icon + Title */}
        <div className="flex-1 flex flex-col items-center">
          <span className="material-symbols-outlined !text-[64px] text-[#e83a3a] leading-none">
            {iconName}
          </span>
          <h3 className="text-lg font-bold tracking-wide text-[#f8fafc] mt-2">{title}</h3>
        </div>

        {/* Right: 3 dots */}
        <div className="w-10 shrink-0 flex justify-end">
          <span className="material-symbols-outlined text-[#94a3b8] hover:text-white transition-colors !text-[24px] leading-none">
            more_vert
          </span>
        </div>

      </div>

      {/* Divider */}
      <div className="h-[1px] bg-white/10 mt-5 -mx-5"></div>

      {/* Bottom Row: Condition Icons */}
      <div className="mt-4 flex justify-center items-center gap-7">
        <span 
          onClick={(e) => {
            e.stopPropagation(); // prevent triggering the card's main click later
            if (onTimeClick) onTimeClick();
          }}
          className={cn("time-trigger material-symbols-outlined !text-[28px] hover:text-white transition-colors cursor-pointer", getIconColor(hasTime))} 
          title="Time"
        >
          schedule
        </span>
        <span className={cn("material-symbols-outlined !text-[28px] hover:text-white transition-colors cursor-pointer", getIconColor(hasBlock))} title="Blocked Content">
          app_blocking
        </span>
        <span className={cn("material-symbols-outlined !text-[28px] hover:text-white transition-colors cursor-pointer", getIconColor(hasAI))} title="AI Powered">
          auto_awesome
        </span>
      </div>

    </div>
  );
}
