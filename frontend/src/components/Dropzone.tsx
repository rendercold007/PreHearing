import { useRef, useState } from "react";
import type { DragEvent } from "react";

const ACCEPTED = [".pdf", ".docx"];

interface DropzoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isAccepted(file: File): boolean {
  return ACCEPTED.some((extension) => file.name.toLowerCase().endsWith(extension));
}

/** Same file dropped twice — or picked twice — should only be analyzed once. */
function merge(existing: File[], incoming: File[]): File[] {
  const seen = new Set(existing.map((file) => `${file.name}:${file.size}`));
  return [...existing, ...incoming.filter((file) => !seen.has(`${file.name}:${file.size}`))];
}

export function Dropzone({ files, onFilesChange, disabled = false }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState<string[]>([]);

  function add(incoming: File[]) {
    setRejected(incoming.filter((file) => !isAccepted(file)).map((file) => file.name));
    onFilesChange(merge(files, incoming.filter(isAccepted)));
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    add(Array.from(event.dataTransfer.files));
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!disabled) setDragging(true);
  }

  return (
    <div className="dropzone-wrap">
      <div
        className={`dropzone${dragging ? " dragging" : ""}${disabled ? " disabled" : ""}`}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!disabled) inputRef.current?.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <span className="dropzone-icon" aria-hidden="true">
          ⬆
        </span>
        <p className="dropzone-title">
          Drop your case files here — or <span className="dropzone-browse">browse</span>
        </p>
        <p className="dropzone-hint">
          PDF or DOCX · pleadings and exhibits together · scanned filings are OCR'd automatically
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          multiple
          disabled={disabled}
          className="dropzone-input"
          onChange={(event) => {
            add(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
      </div>

      {rejected.length > 0 && (
        <p className="dropzone-rejected" role="alert">
          Skipped {rejected.join(", ")} — only PDF and DOCX files can be analyzed.
        </p>
      )}

      {files.length > 0 && (
        <ul className="file-list">
          {files.map((file) => (
            <li key={`${file.name}:${file.size}`} className="file-chip">
              <span className="file-name">{file.name}</span>
              <span className="file-size">{formatSize(file.size)}</span>
              {!disabled && (
                <button
                  type="button"
                  className="file-remove"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => onFilesChange(files.filter((item) => item !== file))}
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
