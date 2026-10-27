import { apiBase } from "@/lib/api";

export function EvidenceSlip({ evidence }) {
    if (!evidence)
        return null;
    const src = evidence.fileUrl ? `${apiBase()}${evidence.fileUrl}` : null;
    return (<figure className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm shadow-ink/5">
      {src ? (<img src={src} alt={`Deposit slip ${evidence.fileName}`} className="max-h-96 w-full bg-[#f7f4ee] object-contain"/>) : (<p className="p-4 text-sm leading-6 text-ink-secondary">This slip was saved as {evidence.fileName}. The photo itself is not available.</p>)}
      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 text-sm text-ink-secondary">
        <span className="font-medium text-ink">{evidence.fileName}</span>
        {evidence.note ? <span className="leading-6">{evidence.note}</span> : null}
      </figcaption>
    </figure>);
}
