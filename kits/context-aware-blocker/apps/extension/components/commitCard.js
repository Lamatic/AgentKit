/**
 * ** COMPONENT: COMMIT CARD **
 * ** DESCRIPTION: Replicates the native CommitT mobile app card UI in Vanilla HTML **
 * ** USAGE: Call createCommitCard(props) to get the HTML string, then inject into DOM **
 */

function createCommitCard({ 
  title = "Focus", 
  iconName = "menu_book", 
  showRisk = false,
  hasTime = true,
  locationIsActive = false,
  hasDigital = true
} = {}) {
  const skullColor = showRisk ? 'text-brand-primary' : 'text-white/10';
  const getIconColor = (isActive) => isActive ? 'text-brand-primary' : 'text-white/10';

  return `
    <div class="w-full bg-brand-card rounded-[32px] cursor-pointer shadow-lg hover:bg-brand-cardHover transition-colors px-5 py-6">
      
      <!-- Top Row: Skull | Icon+Title | Dots — all on one flex line -->
      <div class="flex items-start">
        
        <!-- Left: Skull (fixed width so center stays centered) -->
        <div class="w-10 shrink-0">
          <span class="material-symbols-outlined ${skullColor} text-[22px] leading-none">skull</span>
        </div>

        <!-- Center: Icon + Title (takes remaining space, centered) -->
        <div class="flex-1 flex flex-col items-center">
          <span class="material-symbols-outlined text-[64px] text-brand-primary leading-none">
            ${iconName}
          </span>
          <h3 class="text-lg font-bold tracking-wide text-brand-text mt-2">${title}</h3>
        </div>

        <!-- Right: 3 dots (fixed width, mirrors left) -->
        <div class="w-10 shrink-0 flex justify-end">
          <span class="material-symbols-outlined text-brand-textMuted hover:text-white transition-colors text-[24px] leading-none">more_vert</span>
        </div>

      </div>

      <!-- Divider (Edge to Edge) -->
      <div class="h-[1px] bg-white/10 mt-6 -mx-5"></div>

      <!-- Bottom Row: Condition Icons -->
      <div class="mt-4 flex justify-center gap-7">
        <span class="material-symbols-outlined text-[32px] ${getIconColor(hasTime)}">schedule</span>
        <span class="material-symbols-outlined text-[32px] ${getIconColor(locationIsActive)}">location_on</span>
        <span class="material-symbols-outlined text-[32px] ${getIconColor(hasDigital)}">phonelink_lock</span>
        <span class="material-symbols-outlined text-[32px] ${getIconColor(false)}">photo_camera</span>
        <span class="material-symbols-outlined text-[32px] ${getIconColor(false)}">group</span>
      </div>

    </div>
  `;
}
