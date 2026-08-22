import { useState, useEffect, ReactNode } from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
  children?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  cancelColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A highly reusable modal component for prompting user confirmation.
 * 
 * It supports both simple string messages and complex ReactNode children 
 * for injecting custom forms (e.g., date pickers). It automatically manages 
 * background scroll locking when mounted.
 * 
 * @param {ConfirmationModalProps} props - Configuration options.
 * @param {boolean} props.isOpen - Controls the visibility of the modal.
 * @param {string} props.title - The primary heading.
 * @param {string} [props.message] - Optional descriptive text below the title.
 * @param {ReactNode} [props.children] - Optional custom React content injected above the buttons.
 * @param {string} [props.confirmText="Confirm"] - Text for the primary action button.
 * @param {string} [props.cancelText="Cancel"] - Text for the secondary action button.
 * @param {string} [props.confirmColor="#e83a3a"] - Hex color for the primary action.
 * @param {string} [props.cancelColor="#e83a3a"] - Hex color for the secondary action.
 * @param {Function} props.onConfirm - Callback triggered when the primary button is clicked.
 * @param {Function} props.onCancel - Callback triggered when the secondary button or background is clicked.
 * @returns {JSX.Element | null} The rendered modal overlay or null if closed.
 */
export function ConfirmationModal({
  isOpen,
  title,
  message,
  children,
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
      <div className="w-full max-w-[340px] bg-bg-surface rounded-[24px] p-6 shadow-2xl">
        {/* Title */}
        <h2 className="text-center text-xl font-bold text-text-primary mb-2">
          {title}
        </h2>

        {/* Message */}
        {message && (
          <p className="text-center text-[15px] text-text-muted mb-6">
            {message}
          </p>
        )}

        {/* Custom Content (e.g. forms) */}
        {children && (
          <div className="mb-6">
            {children}
          </div>
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
