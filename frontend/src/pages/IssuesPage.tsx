import type {Issue} from "../types";

interface IssuesPageProps{
    issues: Issue[];
}

export function IssuesPage({issues}: IssuesPageProps){
    return (
        <section>
            <h2>Issues before the court</h2>
            {issues.length === 0 && <p>No issues were identified</p>}

            <ol>
                {issues.map((issue)=>(
                    <li key={issue.statement}>
                        <p>{issue.statement}</p>
                        <p>
                            <em>Type: {issue.issue_type}</em>
                        </p>
                        {issue.related_facts.length > 0 &&(
                            <ul>
                                {issue.related_facts.map((fact)=>(
                                    <li key={fact}>{fact}</li>
                                ))}
                            </ul>
                        )}
                    </li>
                ))}
            </ol>
        </section>
    );
}