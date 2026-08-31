import { ExternalLink, Landmark } from "lucide-react";
import type { IssueResearch } from "../types";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";

interface ResearchPageProps {
  research: IssueResearch[];
}

export function ResearchPage({ research }: ResearchPageProps) {
  if (research.length === 0) {
    return (
      <p className="m-0 text-[0.9rem] text-muted">
        No research results — the research API may not be configured.
      </p>
    );
  }

  return (
    <section className="flex flex-col gap-5">
      {research.map((item) => (
        <div key={item.issue_statement}>
          <div className="mb-2.5 flex items-start gap-2">
            <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <h3 className="m-0 text-[0.92rem] font-semibold leading-snug text-fg">
              {item.issue_statement}
            </h3>
          </div>

          {item.authorities.length === 0 ? (
            <p className="m-0 pl-6 text-[0.85rem] text-muted">No relevant authorities found.</p>
          ) : (
            <div className="flex flex-col gap-2 pl-6">
              {item.authorities.map((authority) => (
                <Card key={authority.doc_id} className="p-3 hover:border-line-hover">
                  <a
                    href={authority.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-start gap-1.5 text-[0.9rem] font-medium text-accent transition-colors hover:text-accent-hover"
                  >
                    <span>{authority.title}</span>
                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70 transition-opacity group-hover:opacity-100" />
                  </a>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {authority.court && <Badge variant="muted">{authority.court}</Badge>}
                    {authority.date && <Badge variant="muted">{authority.date}</Badge>}
                  </div>
                  {authority.relevance && (
                    <p className="mb-0 mt-2 text-[0.85rem] leading-relaxed text-muted">
                      {authority.relevance}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
