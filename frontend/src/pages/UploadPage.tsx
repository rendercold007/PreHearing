import {useRef} from "react";
import type {FormEvent} from "react";

interface UploadPageProps{
    status: "idle" | "loading" | "error" | "done";
    error: string | null;
    onFileSelected: (file: File) => void;
}

export function UploadPage({status, error, onFileSelected} : UploadPageProps){
    const inputRef = useRef<HTMLInputElement>(null);

    function handleSubmit(event : FormEvent){
        event.preventDefault();
        const file = inputRef.current?.files?.[0];
        if(file){
            onFileSelected(file);
        }
    }

    return(
        <section>
            <p>Upload a case file(PDF or DOCX) to generate hearing arguments.</p>

            <form onSubmit={handleSubmit}>
                <input ref={inputRef} type="file" accept=".pdf,.docx" disabled={status === "loading"} />
                <button type="submit" disabled={status === "loading"}>
                    {status === "loading" ? "Analyzing..." : "Analyze"}
                </button>
            </form>
            {error && <p role="alert">{error}</p>}
        </section>
    );
}