import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
  ariaLabel?: string;
}

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  className,
  children,
  ariaLabel,
}) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      className="fixed inset-0 z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 animate-fadeIn" />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div
          className={cn(
            "bg-background text-foreground w-full max-w-lg md:max-w-2xl rounded-xl shadow-lg border animate-zoomIn",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
