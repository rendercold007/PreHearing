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
    <div className="card" role="button" tabIndex={0} onClick={onClick} onKeyDown={handleKeyDown}>
      <span className="card-icon" aria-hidden="true">
        {icon}
      </span>
      <h3 className="card-title">{title}</h3>
      <p className="card-preview">{preview}</p>
      <span className="card-footer">View details →</span>
    </div>
  );
}
