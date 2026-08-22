import {useState} from "react";
import {analyzeCaseFile} from "./api/client";
import type {CaseAnalysis} from "./types";
import {UploadPage} from "./pages/UploadPage";
import { UnderstandingPage } from "./pages/UnderstandingPage";
import {ArgumentsPage} from "./pages/ArgumentsPage";


type Status = "idle" | "loading" | "error" | "done";

function App(){
    const [status, setStatus] = useState<Status>("idle");
    const [analysis, setAnalysis] = useState<CaseAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleFileSelected(file: File){
        setStatus("loading");
        setError(null);

        try {
            const result = await analyzeCaseFile(file);
            setAnalysis(result);
            setStatus("done");
        }
        catch (err){
          setError(err instanceof Error ? err.message : "Something went wrong.");
          setStatus("error");
        }
    }

    function handleReset(){
        setAnalysis(null);
        setError(null);
        setStatus("idle");
    }

    return(
        <main>
            <h1>PreHearing</h1>

            {status != "done" &&(
                <UploadPage status={status} error={error} onFileSelected={handleFileSelected} />
            )}

            {status === "done" && analysis && (
                <>
                <button onClick={handleReset}>Analyze another case</button>
                <UnderstandingPage understanding={analysis.understanding}/>
                <ArgumentsPage arguments={analysis.arguments} />
                </>
            )}
        </main>
    );
}

export default App;