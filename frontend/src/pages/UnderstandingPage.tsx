import type { CaseUnderstanding } from "../types";
import { Citations } from "../components/Citations";
import { h2Title, h3Sub, ulDisc, liItem } from "../ui";

interface UnderstandingPageProps {
  understanding: CaseUnderstanding;
}

export function UnderstandingPage({ understanding }: UnderstandingPageProps) {
  return (
    <section>
      <h2 className={h2Title}>Case Understanding</h2>

      <p className="my-2">
        <strong>Case type:</strong> {understanding.case_type}
      </p>

      <p className="my-2">{understanding.summary}</p>

      <h3 className={h3Sub}>Parties</h3>
      <ul className={ulDisc}>
        {understanding.parties.map((party) => (
          <li key={party.name} className={liItem}>
            {party.name} - {party.role}
          </li>
        ))}
      </ul>

      <h3 className={h3Sub}>Key facts</h3>
      <ul className={ulDisc}>
        {understanding.key_facts.map((fact) => (
          <li key={fact.text} className={liItem}>
            {fact.text} <Citations citations={fact.citations} />
          </li>
        ))}
      </ul>

      <h3 className={h3Sub}>Claims</h3>
      <ul className={ulDisc}>
        {understanding.claims.map((claim) => (
          <li key={claim} className={liItem}>
            {claim}
          </li>
        ))}
      </ul>

      <h3 className={h3Sub}>Disputed Points</h3>
      <ul className={ulDisc}>
        {understanding.disputed_points.map((point) => (
          <li key={point} className={liItem}>
            {point}
          </li>
        ))}
      </ul>
    </section>
  );
}
