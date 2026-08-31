import { Download, FileText, ListChecks, Mic } from "lucide-react";
import type { HearingPrep } from "../types";
import { btnSecondary } from "../ui";
import { Card } from "../components/ui/card";
import { SectionHeading } from "../components/ui/section-heading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";

interface PreparePageProps {
  hearingPrep: HearingPrep;
}

function buildExportText(hearingPrep: HearingPrep): string {
  const lines: string[] = [];

  lines.push("HEARING BRIEF", "=============", "", hearingPrep.brief, "");

  lines.push("ORAL ARGUMENT OUTLINE", "=====================", "");
  hearingPrep.outline.forEach((section, index) => {
    lines.push(`${index + 1}. ${section.heading}`);
    section.talking_points.forEach((point) => lines.push(`   - ${point}`));
    lines.push("");
  });

  lines.push("CHECKLIST", "=========", "");
  hearingPrep.checklist.forEach((entry) => {
    lines.push(`[ ] (${entry.category}) ${entry.item}`);
  });

  return lines.join("\n");
}

function handleExport(hearingPrep: HearingPrep) {
  const blob = new Blob([buildExportText(hearingPrep)], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "hearing-prep.txt";
  link.click();
  URL.revokeObjectURL(url);
}

export function PreparePage({ hearingPrep }: PreparePageProps) {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <SectionHeading icon={FileText} title="Hearing brief" />
        <Card className="p-4">
          <p className="m-0 text-[0.92rem] leading-relaxed text-fg">{hearingPrep.brief}</p>
        </Card>
      </div>

      <div>
        <SectionHeading
          icon={Mic}
          title="Oral argument outline"
          count={hearingPrep.outline.length}
        />
        {hearingPrep.outline.length === 0 ? (
          <p className="m-0 text-muted">No outline was generated.</p>
        ) : (
          <Accordion
            type="multiple"
            defaultValue={hearingPrep.outline.map((_, i) => `outline-${i}`)}
            className="flex flex-col gap-2.5"
          >
            {hearingPrep.outline.map((section, index) => (
              <AccordionItem key={section.heading} value={`outline-${index}`}>
                <AccordionTrigger>
                  <span className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft font-display text-[0.8rem] font-semibold text-accent">
                      {index + 1}
                    </span>
                    <span className="leading-snug">{section.heading}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                    {section.talking_points.map((point) => (
                      <li
                        key={point}
                        className="flex gap-2 text-[0.88rem] leading-relaxed text-fg"
                      >
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      <div>
        <SectionHeading
          icon={ListChecks}
          title="Checklist"
          count={hearingPrep.checklist.length}
        />
        {hearingPrep.checklist.length === 0 ? (
          <p className="m-0 text-muted">No checklist items were generated.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {hearingPrep.checklist.map((entry) => (
              <li
                key={entry.item}
                className="flex items-start gap-2.5 rounded-card border border-line bg-white/[0.02] px-3 py-2.5"
              >
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-line" />
                <span className="text-[0.9rem] leading-relaxed text-fg">
                  <span className="mr-1.5 font-display text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-accent">
                    {entry.category}
                  </span>
                  {entry.item}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <button
          type="button"
          className={`${btnSecondary} inline-flex items-center gap-2`}
          onClick={() => handleExport(hearingPrep)}
        >
          <Download className="h-4 w-4" />
          Export as text
        </button>
      </div>
    </section>
  );
}
