import type { IssueResearch } from "../types";
import { h3Sub, ulDisc, liItem, emMuted, linkAccent } from "../ui";

interface ResearchPageProps {
    research: IssueResearch[];
}

export function ResearchPage({ research }: ResearchPageProps) {
    if (research.length === 0) {
        return (
            <p className="my-2">
                <em className={emMuted}>No research results — the research API may not be configured.</em>
            </p>
        );
    }

    return (
        <section>
            {research.map((item) => (
                <div key={item.issue_statement}>
                    <h3 className={h3Sub}>{item.issue_statement}</h3>
                    {item.authorities.length === 0 ? (
                        <p className="my-2">
                            <em className={emMuted}>No relevant authorities found.</em>
                        </p>
                    ) : (
                        <ul className={ulDisc}>
                            {item.authorities.map((authority) => (
                                <li key={authority.doc_id} className={liItem}>
                                    <a href={authority.url} target="_blank" rel="noreferrer" className={linkAccent}>
                                        {authority.title}
                                    </a>{" "}
                                    ({authority.court}{authority.date ? `, ${authority.date}` : ""})
                                    <p className="my-1">{authority.relevance}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ))}
        </section>
    );
}
