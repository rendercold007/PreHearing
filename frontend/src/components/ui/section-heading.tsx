import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { Badge } from "./badge";

interface SectionHeadingProps {
  icon: LucideIcon;
  title: string;
  count?: number;
  className?: string;
}

/** Icon + title + optional count badge — the recurring header inside result modals. */
export function SectionHeading({ icon: Icon, title, count, className }: SectionHeadingProps) {
  return (
    <div className={cn("mb-3 flex items-center gap-2", className)}>
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
        <Icon className="h-4 w-4" />
      </span>
      <h3 className="m-0 font-display text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-muted">
        {title}
      </h3>
      {count !== undefined && (
        <Badge variant="muted" className="ml-auto">
          {count}
        </Badge>
      )}
    </div>
  );
}
