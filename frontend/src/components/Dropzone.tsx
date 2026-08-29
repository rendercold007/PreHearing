import { useRef, useState } from "react";
import type { DragEvent } from "react";

const ACCEPTED = [".pdf", ".docx"];

// Mirrors the backend defaults (MAX_FILES / MAX_FILE_MB / MAX_TOTAL_MB in Settings).
// Catching this here means the user finds out in the picker instead of after waiting
// out an upload that the server will reject with a 413.
const MAX_FILES = 20;
const MAX_FILE_MB = 25;
const MAX_TOTAL_MB = 60;
const MB = 1024 * 1024;

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
  const [limitError, setLimitError] = useState<string | null>(null);

  function add(incoming: File[]) {
    setRejected(incoming.filter((file) => !isAccepted(file)).map((file) => file.name));

    const accepted = incoming.filter(isAccepted);
    const oversized = accepted.find((file) => file.size > MAX_FILE_MB * MB);
    if (oversized) {
      setLimitError(
        `${oversized.name} is ${formatSize(oversized.size)} — the limit is ${MAX_FILE_MB} MB per file.`,
      );
      return;
    }

    const next = merge(files, accepted);
    if (next.length > MAX_FILES) {
      setLimitError(`You can analyze up to ${MAX_FILES} files at once.`);
      return;
    }

    const total = next.reduce((bytes, file) => bytes + file.size, 0);
    if (total > MAX_TOTAL_MB * MB) {
      setLimitError(
        `Those files total ${formatSize(total)} — the limit is ${MAX_TOTAL_MB} MB per analysis.`,
      );
      return;
    }

    setLimitError(null);
    onFilesChange(next);
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

  const dropzoneClass = [
    "flex flex-col items-center justify-center gap-[0.35rem] rounded-card border-[1.5px] border-dashed px-6 py-10 text-center transition-[border-color,background,transform] duration-200",
    dragging
      ? "border-accent bg-accent-soft scale-[1.005]"
      : "border-line bg-white/[0.015] hover:border-line-hover hover:bg-surface-hover hover:outline-none focus-visible:border-line-hover focus-visible:bg-surface-hover focus-visible:outline-none",
    disabled ? "cursor-default opacity-55" : "cursor-pointer",
  ].join(" ");

  return (
    <div className="flex flex-col gap-3">
      <div
        className={dropzoneClass}
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
        <span className="text-2xl leading-none text-accent" aria-hidden="true">
          ⬆
        </span>
        <p className="mt-[0.4rem] mb-0 font-semibold">
          Drop your case files here — or{" "}
          <span className="text-accent underline underline-offset-[3px]">browse</span>
        </p>
        <p className="m-0 text-[0.85rem] text-muted">
          PDF or DOCX · pleadings and exhibits together · scanned filings are OCR'd automatically
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          multiple
          disabled={disabled}
          className="hidden"
          onChange={(event) => {
            add(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
      </div>

      {rejected.length > 0 && (
        <p className="mt-3 text-[0.88rem] text-danger" role="alert">
          Skipped {rejected.join(", ")} — only PDF and DOCX files can be analyzed.
        </p>
      )}

      {limitError && (
        <p className="mt-3 text-[0.88rem] text-danger" role="alert">
          {limitError}
        </p>
      )}

      {files.length > 0 && (
        <ul className="m-0 mt-4 flex list-none flex-wrap gap-2 p-0">
          {files.map((file) => (
            <li
              key={`${file.name}:${file.size}`}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-hover py-[0.35rem] pr-[0.5rem] pl-[0.8rem] text-[0.85rem]"
            >
              <span className="max-w-[150px] truncate sm:max-w-[260px]">{file.name}</span>
              <span className="text-[0.78rem] text-muted">{formatSize(file.size)}</span>
              {!disabled && (
                <button
                  type="button"
                  className="grid h-[1.2rem] w-[1.2rem] cursor-pointer place-items-center rounded-full bg-transparent p-0 text-base leading-none text-muted transition-colors hover:bg-danger-bg hover:text-danger"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => {
                    setLimitError(null);
                    onFilesChange(files.filter((item) => item !== file));
                  }}
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
