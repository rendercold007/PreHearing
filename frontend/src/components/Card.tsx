import type { KeyboardEvent } from "react";

interface CardProps {
  icon: string;
  title: string;
  preview: string;
  onClick: () => void;
}

export function Card({ icon, title, preview, onClick }: CardProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  }

  return (
    <div
      className="cursor-pointer rounded-card border border-line bg-surface p-6 transition-all duration-[220ms] hover:-translate-y-1.5 hover:border-line-hover hover:bg-surface-hover hover:shadow-card hover:outline-none focus-visible:-translate-y-1.5 focus-visible:border-line-hover focus-visible:bg-surface-hover focus-visible:shadow-card focus-visible:outline-none"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <span className="mb-3 block text-[1.75rem]" aria-hidden="true">
        {icon}
      </span>
      <h3 className="mb-2 text-[1.05rem] font-semibold text-fg">{title}</h3>
      <p className="m-0 text-[0.88rem] leading-[1.55] text-muted">{preview}</p>
      <span className="mt-[1.1rem] inline-block text-[0.8rem] font-semibold tracking-[0.02em] text-accent">
        View details →
      </span>
    </div>
  );
}
