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
            {party.name} â {party.role}
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

      <h3>Legal issues</h3>
      <ul>
        {understanding.legal_issues.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
    </section>
  );
}