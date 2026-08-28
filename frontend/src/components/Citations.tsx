import type { Citation } from "../types";

interface CitationsProps {
  citations: Citation[];
}

export function Citations({ citations }: CitationsProps) {
  if (citations.length === 0) {
    return null;
  }
  return (
    <span className="inline-flex flex-wrap gap-[0.35rem] align-middle">
      {citations.map((citation) => (
        <span
          key={`${citation.source_document}-${citation.location}`}
          className="inline-block whitespace-nowrap rounded-full border border-line bg-accent-soft px-2 py-[0.1rem] text-[0.72rem] text-accent"
          title={`${citation.source_document}, ${citation.location}`}
        >
          {citation.source_document}, {citation.location}
        </span>
      ))}
    </span>
  );
}
