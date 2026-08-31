import { Users, FileText, Scale, AlertTriangle } from "lucide-react";
import type { CaseUnderstanding } from "../types";
import { Citations } from "../components/Citations";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { SectionHeading } from "../components/ui/section-heading";

interface UnderstandingPageProps {
  understanding: CaseUnderstanding;
}

export function UnderstandingPage({ understanding }: UnderstandingPageProps) {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <Badge variant="coral" className="mb-3 capitalize">
          {understanding.case_type}
        </Badge>
        <p className="m-0 text-[0.95rem] leading-relaxed text-fg">{understanding.summary}</p>
      </div>

      {understanding.parties.length > 0 && (
        <div>
          <SectionHeading icon={Users} title="Parties" count={understanding.parties.length} />
          <div className="grid gap-2 sm:grid-cols-2">
            {understanding.parties.map((party) => (
              <Card key={party.name} className="flex items-center justify-between gap-2 px-3 py-2.5">
                <span className="min-w-0 truncate text-[0.9rem] font-medium text-fg">
                  {party.name}
                </span>
                <Badge variant="muted" className="capitalize">
                  {party.role}
                </Badge>
              </Card>
            ))}
          </div>
        </div>
      )}

      {understanding.key_facts.length > 0 && (
        <div>
          <SectionHeading icon={FileText} title="Key facts" count={understanding.key_facts.length} />
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {understanding.key_facts.map((fact) => (
              <li
                key={fact.text}
                className="rounded-card border border-line border-l-[3px] border-l-accent/60 bg-white/[0.02] px-3 py-2.5 text-[0.9rem] leading-relaxed text-fg"
              >
                {fact.text}{" "}
                <span className="mt-1 inline-flex">
                  <Citations citations={fact.citations} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {understanding.claims.length > 0 && (
          <div>
            <SectionHeading icon={Scale} title="Claims" count={understanding.claims.length} />
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {understanding.claims.map((claim) => (
                <li key={claim} className="flex gap-2 text-[0.9rem] leading-relaxed text-fg">
                  <Scale className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                  <span>{claim}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {understanding.disputed_points.length > 0 && (
          <div>
            <SectionHeading
              icon={AlertTriangle}
              title="Disputed points"
              count={understanding.disputed_points.length}
            />
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {understanding.disputed_points.map((point) => (
                <li key={point} className="flex gap-2 text-[0.9rem] leading-relaxed text-fg">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-coral" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
