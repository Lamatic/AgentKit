import { useState, useEffect } from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  cancelColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "#e83a3a",
  cancelColor = "#e83a3a",
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-8">
      {/* Modal Content Box */}
      <div className="w-full max-w-[340px] bg-[#151515] rounded-[24px] p-6 shadow-2xl">
        {/* Title */}
        <h2 className="text-center text-xl font-bold text-[#f8fafc] mb-2">
          {title}
        </h2>

        {/* Message */}
        {message && (
          <p className="text-center text-[15px] text-[#94a3b8] mb-6">
            {message}
          </p>
        )}

        {/* Action Buttons Row */}
        <div className="flex justify-end gap-6 mt-2">
          <button 
            onClick={onCancel}
            className="text-[16px] font-bold uppercase transition-opacity hover:opacity-80"
            style={{ color: cancelColor }}
          >
            {cancelText}
          </button>
          
          <button 
            onClick={onConfirm}
            className="text-[16px] font-bold uppercase transition-opacity hover:opacity-80"
            style={{ color: confirmColor }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
