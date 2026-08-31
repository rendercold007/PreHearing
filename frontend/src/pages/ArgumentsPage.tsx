import { Swords, Shield, BookMarked } from "lucide-react";
import type { Argument } from "../types";
import { Citations } from "../components/Citations";
import { AuthorityLinks } from "../components/AuthorityLinks";
import { Badge } from "../components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";

interface ArgumentsPageProps {
  arguments: Argument[];
}

export function ArgumentsPage({ arguments: args }: ArgumentsPageProps) {
  if (args.length === 0) {
    return <p className="m-0 text-muted">No arguments were generated.</p>;
  }

  return (
    <Accordion
      type="multiple"
      defaultValue={args.length > 0 ? ["arg-0"] : []}
      className="flex flex-col gap-2.5"
    >
      {args.map((argument, index) => (
        <AccordionItem key={argument.point} value={`arg-${index}`}>
          <AccordionTrigger>
            <span className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft font-display text-[0.8rem] font-semibold text-accent">
                {index + 1}
              </span>
              <span className="leading-snug">{argument.point}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4">
            {argument.legal_basis && (
              <div>
                <Badge variant="muted" className="mb-1.5">
                  Legal basis
                </Badge>
                <p className="m-0 text-[0.88rem] leading-relaxed text-muted">
                  {argument.legal_basis}
                </p>
              </div>
            )}

            {argument.supporting_facts.length > 0 && (
              <div>
                <p className="mb-1.5 font-display text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted">
                  Supporting facts
                </p>
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {argument.supporting_facts.map((fact) => (
                    <li
                      key={fact.text}
                      className="rounded-lg border-l-2 border-accent/50 bg-white/[0.02] px-3 py-2 text-[0.88rem] leading-relaxed text-fg"
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

            {argument.authorities.length > 0 && (
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 font-display text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted">
                  <BookMarked className="h-3.5 w-3.5" /> Authorities
                </p>
                <AuthorityLinks authorities={argument.authorities} />
              </div>
            )}

            {argument.counter_argument && (
              <div className="rounded-card border border-coral/25 bg-coral-soft p-3">
                <p className="m-0 mb-1 flex items-center gap-1.5 font-display text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-coral">
                  <Swords className="h-3.5 w-3.5" /> Counter-argument
                </p>
                <p className="m-0 text-[0.88rem] leading-relaxed text-fg">
                  {argument.counter_argument}
                </p>
              </div>
            )}

            {argument.rebuttal && (
              <div className="rounded-card border border-accent/25 bg-accent-soft p-3">
                <p className="m-0 mb-1 flex items-center gap-1.5 font-display text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-accent">
                  <Shield className="h-3.5 w-3.5" /> Rebuttal
                </p>
                <p className="m-0 text-[0.88rem] leading-relaxed text-fg">{argument.rebuttal}</p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
