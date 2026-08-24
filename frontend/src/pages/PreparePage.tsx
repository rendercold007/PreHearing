import type { HearingPrep } from "../types";

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
    <section>
      <h2>Prepare</h2>
      <button onClick={() => handleExport(hearingPrep)}>Export as text</button>

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
