import type { IssueResearch } from "../types";

interface ResearchPageProps {
    research: IssueResearch[];
}

export function ResearchPage({ research }: ResearchPageProps) {
    if (research.length === 0) {
        return <p><em>No research results — the research API may not be configured.</em></p>;
    }

    return (
        <section>
            {research.map((item) => (
                <div key={item.issue_statement}>
                    <h3>{item.issue_statement}</h3>
                    {item.authorities.length === 0 ? (
                        <p><em>No relevant authorities found.</em></p>
                    ) : (
                        <ul>
                            {item.authorities.map((authority) => (
                                <li key={authority.doc_id}>
                                    <a href={authority.url} target="_blank" rel="noreferrer">
                                        {authority.title}
                                    </a>{" "}
                                    ({authority.court}{authority.date ? `, ${authority.date}` : ""})
                                    <p>{authority.relevance}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ))}
        </section>
    );
}