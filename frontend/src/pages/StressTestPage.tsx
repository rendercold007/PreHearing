import { Quote, Lightbulb } from "lucide-react";
import type { StressTestPoint } from "../types";
import { AuthorityLinks } from "../components/AuthorityLinks";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";

interface StressTestPageProps {
  stressTest: StressTestPoint[];
}

export function StressTestPage({ stressTest }: StressTestPageProps) {
  if (stressTest.length === 0) {
    return <p className="m-0 text-muted">No weaknesses or objections were identified.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {stressTest.map((item) => (
        <Card key={item.point} className="border-l-[3px] border-l-coral/60 p-4">
          <Badge variant="coral" className="mb-2 capitalize">
            {item.category}
          </Badge>
          <p className="m-0 text-[0.92rem] leading-relaxed text-fg">{item.point}</p>

          {item.authorities.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 flex items-center gap-1.5 font-display text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted">
                <Quote className="h-3.5 w-3.5" /> They may cite
              </p>
              <AuthorityLinks authorities={item.authorities} />
            </div>
          )}

          {item.suggested_response && (
            <div className="mt-3 rounded-card border border-accent/25 bg-accent-soft p-3">
              <p className="m-0 mb-1 flex items-center gap-1.5 font-display text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-accent">
                <Lightbulb className="h-3.5 w-3.5" /> Suggested response
              </p>
              <p className="m-0 text-[0.88rem] leading-relaxed text-fg">
                {item.suggested_response}
              </p>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
