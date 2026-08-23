import type { StressTestPoint } from "../types";

interface StressTestPageProps {
  stressTest: StressTestPoint[];
}

export function StressTestPage({ stressTest }: StressTestPageProps) {
  return (
    <section>
      <h2>Stress Test</h2>

      {stressTest.length === 0 && <p>No weaknesses or objections were identified.</p>}

      <ol>
        {stressTest.map((item) => (
          <li key={item.point}>
            <p>
              <strong>{item.category}:</strong> {item.point}
            </p>

            {item.suggested_response && (
              <p>
                <em>Suggested response: {item.suggested_response}</em>
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}