import type { Argument } from "../types";

interface ArgumentsPageProps {
  arguments: Argument[];
}

export function ArgumentsPage({ arguments: args }: ArgumentsPageProps) {
  return (
    <section>
      <h2>Arguments for Hearing</h2>

      {args.length === 0 && <p>No arguments were generated.</p>}

      <ol>
        {args.map((argument) => (
          <li key={argument.point}>
            <p>{argument.point}</p>

            {argument.legal_basis && (
              <p>
                <em>Legal basis: {argument.legal_basis}</em>
              </p>
            )}

            {argument.supporting_facts.length > 0 && (
              <ul>
                {argument.supporting_facts.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            )}

            {argument.counter_argument && (
              <p>
                <strong>Counter-argument:</strong> {argument.counter_argument}
              </p>
            )}

            {argument.rebuttal && (
              <p>
                <strong>Rebuttal:</strong> {argument.rebuttal}
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}