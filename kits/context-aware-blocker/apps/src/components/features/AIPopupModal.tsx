interface AIPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * A placeholder modal for configuring AI-specific block logic.
 * 
 * TODO: This component is currently an empty shell ("Popup holder active"). It 
 * needs to be wired up with a prompt engineering UI to allow users to override 
 * default system prompts or set specific strictness thresholds for the LLM.
 * 
 * @param {AIPopupModalProps} props - Configuration options.
 * @param {boolean} props.isOpen - Controls the visibility of the modal.
 * @param {Function} props.onClose - Callback triggered when the close button is clicked.
 * @returns {JSX.Element | null} The rendered modal or null if closed.
 */
export function AIPopupModal({ isOpen, onClose }: AIPopupModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm">
      
      {/* Modal Content Holder */}
      <div className="bg-[#0f0f0f] w-[90%] max-w-[420px] rounded-[24px] p-6 border border-white/10 flex flex-col shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-wide mb-1">AI Description</h2>
            <p className="text-[#94a3b8] text-sm">Configure how AI detects this commitment</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Empty Holder Placeholder */}
        <div className="py-12 flex flex-col items-center justify-center text-[#94a3b8]">
          <span className="material-symbols-outlined text-4xl mb-2 text-[#e83a3a]">auto_awesome</span>
          <span className="text-sm font-medium">Popup holder active. Content cleared.</span>
        </div>

      </div>
    </div>
  );
}
