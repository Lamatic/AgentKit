"use client";

import { useRef, useEffect } from "react";
import SignaturePad from "react-signature-canvas";
import { X, Check, Eraser } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dataUrl: string) => void;
}

export default function SignatureCanvas({ isOpen, onClose, onConfirm }: Props) {
  const sigRef = useRef<SignaturePad>(null);

  // Draw the baseline guide line once the canvas is ready
  useEffect(() => {
    if (!isOpen) return;
    // Wait a tick for the canvas to mount
    const timeout = setTimeout(() => {
      const canvas = sigRef.current?.getCanvas();
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const y = canvas.height - 32; // 32px from the bottom
      ctx.save();
      ctx.strokeStyle = "#c8c8c4";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(24, y);
      ctx.lineTo(canvas.width - 24, y);
      ctx.stroke();
      ctx.restore();
    }, 50);
    return () => clearTimeout(timeout);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClear = () => {
    sigRef.current?.clear();
    // Redraw the baseline after clearing
    setTimeout(() => {
      const canvas = sigRef.current?.getCanvas();
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const y = canvas.height - 32;
      ctx.save();
      ctx.strokeStyle = "#c8c8c4";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(24, y);
      ctx.lineTo(canvas.width - 24, y);
      ctx.stroke();
      ctx.restore();
    }, 10);
  };

  const handleConfirm = () => {
    if (sigRef.current?.isEmpty()) return;
    const dataUrl = sigRef.current?.toDataURL("image/png");
    if (dataUrl) onConfirm(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface border border-border-custom rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Sign here</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-elevated transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {/* Canvas */}
        <div
          className="rounded-lg overflow-hidden mb-4"
          style={{
            background: "#f5f5f3",
            border: "1.5px dashed #c0c0bb",
          }}
        >
          <SignaturePad
            ref={sigRef}
            canvasProps={{
              className: "w-full",
              width: 460,
              height: 200,
              style: { width: "100%", height: "200px", background: "#f5f5f3" },
            }}
            backgroundColor="#f5f5f3"
            penColor="#1a1a1a"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2.5 border border-border-custom text-text-secondary rounded-lg hover:border-danger/40 hover:text-danger transition-colors text-sm"
          >
            <Eraser className="w-4 h-4" />
            Clear
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-colors text-sm"
          >
            <Check className="w-4 h-4" />
            Confirm Signature
          </button>
        </div>
      </div>
    </div>
  );
}
