import type { Citation } from "../types";

interface CitationsProps {
  citations: Citation[];
}

export function Citations({ citations }: CitationsProps) {
  if (citations.length === 0) {
    return null;
  }
  return (
    <span className="citations">
      {citations.map((citation) => (
        <span
          key={`${citation.source_document}-${citation.location}`}
          className="citation"
          title={`${citation.source_document}, ${citation.location}`}
        >
          {citation.source_document}, {citation.location}
        </span>
      ))}
    </span>
  );
}
