interface ActiveTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ActiveTimeModal({ isOpen, onClose }: ActiveTimeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm">
      
      {/* Modal Content Holder */}
      <div className="bg-[#0f0f0f] w-[90%] max-w-[420px] rounded-[24px] p-6 border border-white/10 flex flex-col shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-wide mb-1">Active Time</h2>
            <p className="text-[#94a3b8] text-sm">Choose when this commitment is active</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Empty Holder Placeholder */}
        <div className="py-12 flex flex-col items-center justify-center text-[#94a3b8]">
          <span className="material-symbols-outlined text-4xl mb-2 text-[#e83a3a]">schedule</span>
          <span className="text-sm font-medium">Popup holder active. Content cleared.</span>
        </div>

      </div>
    </div>
  );
}
