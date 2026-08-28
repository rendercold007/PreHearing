import type {Issue} from "../types";
import { h2Title, olDecimal, ulDisc, liItem, emMuted } from "../ui";

interface IssuesPageProps{
    issues: Issue[];
}

export function IssuesPage({issues}: IssuesPageProps){
    return (
        <section>
            <h2 className={h2Title}>Issues before the court</h2>
            {issues.length === 0 && <p className="my-2">No issues were identified</p>}

            <ol className={olDecimal}>
                {issues.map((issue)=>(
                    <li key={issue.statement} className={liItem}>
                        <p className="my-1">{issue.statement}</p>
                        <p className="my-1">
                            <em className={emMuted}>Type: {issue.issue_type}</em>
                        </p>
                        {issue.related_facts.length > 0 &&(
                            <ul className={ulDisc}>
                                {issue.related_facts.map((fact)=>(
                                    <li key={fact} className={liItem}>{fact}</li>
                                ))}
                            </ul>
                        )}
                    </li>
                ))}
            </ol>
        </section>
    );
}
