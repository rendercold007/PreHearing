import { ExternalLink } from "lucide-react";
import type { Authority } from "../types";

interface AuthorityLinksProps {
  authorities: Authority[];
}

/** Case-law authorities rendered as pill links — shared by arguments + stress test. */
export function AuthorityLinks({ authorities }: AuthorityLinksProps) {
  if (authorities.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {authorities.map((authority) => (
        <a
          key={authority.doc_id}
          href={authority.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[0.78rem] text-fg transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent"
        >
          <ExternalLink className="h-3 w-3 shrink-0 text-accent" />
          <span className="truncate">
            {authority.title}
            {authority.court ? ` (${authority.court})` : ""}
          </span>
        </a>
      ))}
    </div>
  );
}
