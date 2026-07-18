import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import { AlertTriangle, Search } from "lucide-react";
import { documentTypes, type AppData, type DocumentType } from "../types";
import { DocumentList } from "../components/documents/DocumentList";
import { DocumentUpload } from "../components/documents/DocumentUpload";

interface DocumentsPageProps {
  data: AppData;
  setData: Dispatch<SetStateAction<AppData>>;
}

type DocumentFilter = "alles" | DocumentType;

export const DocumentsPage = ({ data, setData }: DocumentsPageProps) => {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<DocumentFilter>("alles");

  const warnings = useMemo(() => {
    const transportWarnings = data.transports
      .filter(
        (transport) =>
          ["geboekt", "betaald"].includes(transport.status) &&
          transport.documentIds.length === 0 &&
          !data.documents.some((document) => document.linkedTransportId === transport.id)
      )
      .map((transport) => `Boeking ${transport.from} naar ${transport.to} heeft nog geen document.`);
    const accommodationWarnings = data.destinations
      .filter(
        (destination) =>
          ["geboekt", "betaald"].includes(destination.accommodationStatus) &&
          !data.documents.some((document) => document.linkedDestinationId === destination.id)
      )
      .map((destination) => `Verblijf bij ${destination.name} heeft nog geen document.`);
    return [...transportWarnings, ...accommodationWarnings];
  }, [data.destinations, data.documents, data.transports]);

  const filteredDocuments = useMemo(
    () =>
      data.documents.filter((document) => {
        const queryMatches = document.fileName.toLowerCase().includes(query.toLowerCase());
        const typeMatches = typeFilter === "alles" || document.documentType === typeFilter;
        return queryMatches && typeMatches;
      }),
    [data.documents, query, typeFilter]
  );

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-950">Documenten</h2>
        <p className="text-sm text-slate-500">Upload en koppel alleen documenten die je zelf toevoegt.</p>
      </div>

      <DocumentUpload setData={setData} />

      {warnings.length ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle size={18} />
            Aandachtspunten
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            {warnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="min-w-64 flex-1">
          <span className="label">Zoeken op documentnaam</span>
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              className="input pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Zoeken"
            />
          </div>
        </label>

        <label>
          <span className="label">Documenttype</span>
          <select
            className="input mt-1 min-w-56"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as DocumentFilter)}
          >
            <option value="alles">Alle types</option>
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
      </div>

      <DocumentList data={data} documents={filteredDocuments} setData={setData} />
    </section>
  );
};
