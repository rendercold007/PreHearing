import type { StressTestPoint } from "../types";
import { h2Title, olDecimal, liItem, emMuted, linkAccent } from "../ui";

interface StressTestPageProps {
  stressTest: StressTestPoint[];
}

export function StressTestPage({ stressTest }: StressTestPageProps) {
  return (
    <section>
      <h2 className={h2Title}>Stress Test</h2>

      {stressTest.length === 0 && (
        <p className="my-2">No weaknesses or objections were identified.</p>
      )}

      <ol className={olDecimal}>
        {stressTest.map((item) => (
          <li key={item.point} className={liItem}>
            <p className="my-1">
              <strong>{item.category}:</strong> {item.point}
            </p>

            {item.authorities.length > 0 && (
              <p className="my-1">
                <strong>They may cite:</strong>{" "}
                {item.authorities.map((authority, index) => (
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

            {item.suggested_response && (
              <p className="my-1">
                <em className={emMuted}>Suggested response: {item.suggested_response}</em>
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
