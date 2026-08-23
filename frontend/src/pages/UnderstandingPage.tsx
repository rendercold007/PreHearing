import type { CaseUnderstanding } from "../types";

interface UnderstandingPageProps {
  understanding: CaseUnderstanding;
}

export function UnderstandingPage({ understanding }: UnderstandingPageProps) {
  return (
    <section>
      <h2>Case Understanding</h2>

      <p>
        <strong>Case type:</strong> {understanding.case_type}
      </p>

      <p>{understanding.summary}</p>

      <h3>Parties</h3>
      <ul>
        {understanding.parties.map((party) => (
          <li key={party.name}>
            {party.name} - {party.role}
          </li>
        ))}
      </ul>

      <h3>Key facts</h3>
      <ul>
        {understanding.key_facts.map((fact) => (
          <li key={fact}>{fact}</li>
        ))}
      </ul>

      <h3>Claims</h3>
      <ul>
        {understanding.claims.map((claim) => (
          <li key={claim}>{claim}</li>
        ))}
      </ul>

      <h3>Disputed Points</h3>
      <ul>
        {understanding.disputed_points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </section>
  );
}