import { useState } from "react";
import { downloadCaseExport } from "../api/cases";
import type { HearingPrep } from "../types";

interface PreparePageProps {
  hearingPrep: HearingPrep;
  caseId: number | null;
}

function buildExportText(hearingPrep: HearingPrep): string {
  const lines: string[] = [];

  lines.push(
    "AI-GENERATED — verify every fact and authority against the source documents",
    "and linked judgments before relying on this in court.",
    "",
  );

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

export function PreparePage({ hearingPrep, caseId }: PreparePageProps) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  async function handleDocxExport(id: number) {
    setExporting(true);
    setExportError(null);
    try {
      await downloadCaseExport(id);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "The export could not be downloaded.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <section>
      <h2>Prepare</h2>
      <div className="export-actions">
        {caseId !== null && (
          <button type="button" onClick={() => handleDocxExport(caseId)} disabled={exporting}>
            {exporting ? "Preparing…" : "Export as Word (.docx)"}
          </button>
        )}
        <button type="button" onClick={() => handleExport(hearingPrep)}>
          Export as text
        </button>
      </div>
      {caseId === null && (
        <p className="export-note">
          This run was not saved to your case history, so the Word export is unavailable.
        </p>
      )}
      {exportError && <p role="alert">{exportError}</p>}

      <h3>Hearing Brief</h3>
      <p>{hearingPrep.brief}</p>

      <h3>Oral Argument Outline</h3>
      {hearingPrep.outline.length === 0 && <p>No outline was generated.</p>}
      <ol>
        {hearingPrep.outline.map((section) => (
          <li key={section.heading}>
            <p>{section.heading}</p>
            <ul>
              {section.talking_points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <h3>Checklist</h3>
      {hearingPrep.checklist.length === 0 && <p>No checklist items were generated.</p>}
      <ul>
        {hearingPrep.checklist.map((entry) => (
          <li key={entry.item}>
            <strong>{entry.category}:</strong> {entry.item}
          </li>
        ))}
      </ul>
    </section>
  );
}
