import { cn } from "@/lib/utils";

interface CommitCardProps {
  title?: string;
  iconName?: string;
  showRisk?: boolean;
  hasTime?: boolean;
  hasBlock?: boolean;
  onClick?: () => void;
  onTimeClick?: () => void;
  onBlockClick?: () => void;
  onDeleteClick?: () => void;
}

/**
 * Renders a visual representation of a single focus block (commit) on the dashboard.
 * 
 * Provides quick-action targets for editing the active time window, modifying 
 * blocked content, or deleting the block entirely.
 * 
 * @param {CommitCardProps} props - The visual and interactive configuration.
 * @param {string} [props.title="Focus"] - The display name of the block.
 * @param {string} [props.iconName="menu_book"] - A Google Material Symbols font identifier.
 * @param {boolean} [props.showRisk=false] - If true, highlights the skull icon indicating high-risk settings.
 * @param {boolean} [props.hasTime=true] - If true, highlights the clock icon indicating active time rules exist.
 * @param {boolean} [props.hasBlock=true] - If true, highlights the block icon indicating content rules exist.
 * @param {Function} [props.onClick] - Callback when the main card body is clicked.
 * @param {Function} [props.onTimeClick] - Callback when the clock quick-action is clicked.
 * @param {Function} [props.onBlockClick] - Callback when the shield quick-action is clicked.
 * @param {Function} [props.onDeleteClick] - Callback when the trash icon is clicked.
 * @returns {JSX.Element} The rendered card component.
 */
export function CommitCard({
  title = "Focus",
  iconName = "menu_book",
  showRisk = false,
  hasTime = true,
  hasBlock = true,
  onClick,
  onTimeClick,
  onBlockClick,
  onDeleteClick,
}: CommitCardProps) {
  const getIconColor = (isActive: boolean) => isActive ? 'text-[#e83a3a]' : 'text-white/10';

  return (
    <div 
      onClick={onClick}
      className="w-full bg-[#151515] rounded-[32px] cursor-pointer shadow-lg hover:bg-[#1f1f1f] transition-colors px-5 py-6"
    >
      
      {/* Top Row: Skull | Icon+Title | Trash */}
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

        {/* Right: Trash Button */}
        {/* ** PRODUCTION LEVEL ACTION: Trigger Delete Confirmation Modal ** */}
        <div className="w-10 shrink-0 flex justify-end">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (onDeleteClick) onDeleteClick();
            }}
            className="flex items-center justify-center p-1 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
            title="Delete Block"
          >
            <span className="material-symbols-outlined text-[#94a3b8] hover:text-white transition-colors !text-[24px] leading-none">
              delete
            </span>
          </button>
        </div>

      </div>

      {/* Divider */}
      <div className="h-[1px] bg-white/10 mt-5 -mx-5"></div>

      {/* Bottom Row: Condition Icons */}
      <div className="mt-4 flex justify-center items-center gap-10">
        <span 
          onClick={(e) => {
            e.stopPropagation();
            if (onTimeClick) onTimeClick();
          }}
          className={cn("time-trigger material-symbols-outlined !text-[34px] hover:text-white transition-colors cursor-pointer", getIconColor(hasTime))} 
          title="Time"
        >
          schedule
        </span>
        <span 
          onClick={(e) => {
            e.stopPropagation();
            if (onBlockClick) onBlockClick();
          }}
          className={cn("material-symbols-outlined !text-[34px] hover:text-white transition-colors cursor-pointer", getIconColor(hasBlock))} 
          title="Blocked Content"
        >
          app_blocking
        </span>
      </div>
    </div>
  );
}
