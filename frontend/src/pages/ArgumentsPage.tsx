import type { Argument } from "../types";
import { Citations } from "../components/Citations";
import { h2Title, olDecimal, ulDisc, liItem, emMuted, linkAccent } from "../ui";

interface ArgumentsPageProps {
  arguments: Argument[];
}

export function ArgumentsPage({ arguments: args }: ArgumentsPageProps) {
  return (
    <section>
      <h2 className={h2Title}>Arguments for Hearing</h2>

      {args.length === 0 && <p className="my-2">No arguments were generated.</p>}

      <ol className={olDecimal}>
        {args.map((argument) => (
          <li key={argument.point} className={liItem}>
            <p className="my-1">{argument.point}</p>

            {argument.legal_basis && (
              <p className="my-1">
                <em className={emMuted}>Legal basis: {argument.legal_basis}</em>
              </p>
            )}

            {argument.supporting_facts.length > 0 && (
              <ul className={ulDisc}>
                {argument.supporting_facts.map((fact) => (
                  <li key={fact.text} className={liItem}>
                    {fact.text} <Citations citations={fact.citations} />
                  </li>
                ))}
              </ul>
            )}

            {argument.authorities.length > 0 && (
              <p className="my-1">
                <strong>Authorities:</strong>{" "}
                {argument.authorities.map((authority, index) => (
                  <span key={authority.doc_id}>
                    {index > 0 && "; "}
                    <a href={authority.url} target="_blank" rel="noreferrer" className={linkAccent}>
                      {authority.title}
                    </a>
                    {authority.court && ` (${authority.court})`}
                  </span>
                ))}
              </p>
            )}

            {argument.counter_argument && (
              <p className="my-1">
                <strong>Counter-argument:</strong> {argument.counter_argument}
              </p>
            )}

            {argument.rebuttal && (
              <p className="my-1">
                <strong>Rebuttal:</strong> {argument.rebuttal}
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
