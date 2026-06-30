import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { Download, Edit2, FileText, Trash2 } from "lucide-react";
import { EmptyState } from "../EmptyState";
import { StatusBadge } from "../StatusBadge";
import { deleteDocumentBlob, getDocumentBlob } from "../../lib/documentStorage";
import { formatDate } from "../../data/emptyTrip";
import type { AppData, TravelDocument } from "../../types";
import { DocumentForm } from "./DocumentForm";

interface DocumentListProps {
  data: AppData;
  setData: Dispatch<SetStateAction<AppData>>;
  documents: TravelDocument[];
}

export const DocumentList = ({ data, setData, documents }: DocumentListProps) => {
  const [editingDocument, setEditingDocument] = useState<TravelDocument | null>(null);
  const [message, setMessage] = useState("");

  const updateDocument = (document: TravelDocument) => {
    setData((current) => ({
      ...current,
      documents: current.documents.map((item) => (item.id === document.id ? document : item)),
      dayPlans: current.dayPlans.map((day) => ({
        ...day,
        documentIds:
          day.id === document.linkedDayId
            ? Array.from(new Set([...day.documentIds, document.id]))
            : day.documentIds.filter((documentId) => documentId !== document.id),
      })),
      expenses: current.expenses.map((expense) => ({
        ...expense,
        documentIds:
          expense.id === document.linkedExpenseId
            ? Array.from(new Set([...expense.documentIds, document.id]))
            : expense.documentIds.filter((documentId) => documentId !== document.id),
      })),
    }));
    setEditingDocument(null);
  };

  const openBlob = async (document: TravelDocument, download: boolean) => {
    const blob = await getDocumentBlob(document.fileBlobKey);
    if (!blob) {
      setMessage("Bestand niet gevonden in de lokale browseropslag.");
      return;
    }
    const url = URL.createObjectURL(blob);
    if (download) {
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = document.fileName;
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const deleteDocument = async (document: TravelDocument) => {
    if (!window.confirm("Dit document verwijderen?")) return;
    await deleteDocumentBlob(document.fileBlobKey);
    setData((current) => ({
      ...current,
      documents: current.documents.filter((item) => item.id !== document.id),
      dayPlans: current.dayPlans.map((day) => ({
        ...day,
        documentIds: day.documentIds.filter((documentId) => documentId !== document.id),
      })),
      expenses: current.expenses.map((expense) => ({
        ...expense,
        documentIds: expense.documentIds.filter((documentId) => documentId !== document.id),
      })),
      transports: current.transports.map((transport) => ({
        ...transport,
        documentIds: transport.documentIds.filter((documentId) => documentId !== document.id),
      })),
    }));
  };

  if (data.documents.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Nog geen documenten toegevoegd."
        actionLabel="Document uploaden"
        onAction={() => window.document.getElementById("document-upload-input")?.click()}
      />
    );
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Geen documenten gevonden met deze zoekterm of filter.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {message}
        </div>
      ) : null}

      {editingDocument ? (
        <DocumentForm
          data={data}
          document={editingDocument}
          onCancel={() => setEditingDocument(null)}
          onSubmit={updateDocument}
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {documents.map((document) => {
          const day = data.dayPlans.find((item) => item.id === document.linkedDayId);
          const destination = data.destinations.find((item) => item.id === document.linkedDestinationId);
          const expense = data.expenses.find((item) => item.id === document.linkedExpenseId);
          return (
            <article className="panel" key={document.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <FileText size={18} className="text-mint-700" />
                    <h3 className="break-all font-bold text-slate-950">{document.fileName}</h3>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge status={document.documentType} />
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {document.fileType}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="icon-btn"
                    type="button"
                    title="Openen"
                    onClick={() => void openBlob(document, false)}
                  >
                    <FileText size={16} />
                  </button>
                  <button
                    className="icon-btn"
                    type="button"
                    title="Downloaden"
                    onClick={() => void openBlob(document, true)}
                  >
                    <Download size={16} />
                  </button>
                  <button
                    className="icon-btn"
                    type="button"
                    title="Document bewerken"
                    onClick={() => setEditingDocument(document)}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="icon-btn text-rose-600"
                    type="button"
                    title="Document verwijderen"
                    onClick={() => void deleteDocument(document)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="label">Uploaddatum</dt>
                  <dd className="mt-1 text-slate-700">{formatDate(document.uploadedAt.slice(0, 10))}</dd>
                </div>
                <div>
                  <dt className="label">Gekoppelde dag</dt>
                  <dd className="mt-1 text-slate-700">{day ? `Dag ${day.dayNumber}` : "-"}</dd>
                </div>
                <div>
                  <dt className="label">Bestemming</dt>
                  <dd className="mt-1 text-slate-700">{destination?.name ?? "-"}</dd>
                </div>
                <div>
                  <dt className="label">Budgetpost</dt>
                  <dd className="mt-1 text-slate-700">{expense?.title ?? "-"}</dd>
                </div>
              </dl>

              {document.notes ? <p className="mt-4 text-sm text-slate-500">{document.notes}</p> : null}
            </article>
          );
        })}
      </div>
    </div>
  );
};
