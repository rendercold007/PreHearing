import { useEffect } from "react";
import type { MouseEvent, ReactNode } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps) {
  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function stopPropagation(event: MouseEvent) {
    event.stopPropagation();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-[rgba(4,5,8,0.72)] px-4 py-8 backdrop-blur-[4px] animate-overlay-fade sm:px-6 sm:py-16"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[720px] rounded-card border border-line bg-surface p-5 shadow-card animate-modal-slide [overflow-wrap:break-word] sm:p-8"
        onClick={stopPropagation}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <button
          type="button"
          className="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-line bg-transparent text-[0.95rem] leading-none text-muted transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
        <div className="mb-5 border-b border-line pb-4 pr-10">
          <h2 className="m-0 text-[1.3rem] font-bold tracking-[-0.01em]">{title}</h2>
        </div>
        {children}
      </div>
    </div>
  );
}
