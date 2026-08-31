import type { Issue } from "../types";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";

interface IssuesPageProps {
  issues: Issue[];
}

export function IssuesPage({ issues }: IssuesPageProps) {
  if (issues.length === 0) {
    return <p className="m-0 text-muted">No issues were identified.</p>;
  }

  return (
    <ol className="m-0 flex list-none flex-col gap-3 p-0">
      {issues.map((issue, index) => (
        <Card key={issue.statement} className="p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft font-display text-[0.85rem] font-semibold text-accent">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="m-0 text-[0.95rem] font-medium leading-snug text-fg">
                  {issue.statement}
                </p>
              </div>
              <Badge variant="coral" className="capitalize">
                {issue.issue_type}
              </Badge>

              {issue.related_facts.length > 0 && (
                <ul className="mt-3 flex list-none flex-col gap-1.5 p-0">
                  {issue.related_facts.map((fact) => (
                    <li
                      key={fact}
                      className="flex gap-2 text-[0.85rem] leading-relaxed text-muted"
                    >
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      ))}
    </ol>
  );
}
