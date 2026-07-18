import type { Dispatch, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";
import { Download, Edit2, FileText, Loader2, Trash2 } from "lucide-react";
import { EmptyState } from "../EmptyState";
import { StatusBadge } from "../StatusBadge";
import {
  deleteDocumentBlob,
  formatFileSize,
  getDocumentBlob,
  getDocumentStorageErrorMessage,
} from "../../lib/documentStorage";
import { formatDate } from "../../data/emptyTrip";
import type { AppData, TravelDocument } from "../../types";
import { DocumentForm } from "./DocumentForm";

interface DocumentListProps {
  data: AppData;
  setData: Dispatch<SetStateAction<AppData>>;
  documents: TravelDocument[];
}

interface Feedback {
  kind: "success" | "error";
  text: string;
}

type DocumentAction = "open" | "download" | "delete";

interface BusyAction {
  documentId: string;
  action: DocumentAction;
}

const feedbackClasses: Record<Feedback["kind"], string> = {
  success: "border-mint-200 bg-mint-50 text-mint-800",
  error: "border-rose-200 bg-rose-50 text-rose-800",
};

const syncDocumentId = (documentIds: string[], documentId: string, shouldLink: boolean) => {
  const withoutDocument = documentIds.filter((id) => id !== documentId);
  return shouldLink ? [...withoutDocument, documentId] : withoutDocument;
};

export const DocumentList = ({ data, setData, documents }: DocumentListProps) => {
  const [editingDocument, setEditingDocument] = useState<TravelDocument | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busyAction, setBusyAction] = useState<BusyAction | null>(null);
  const formRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editingDocument) return;

    const frame = window.requestAnimationFrame(() => {
      formRegionRef.current?.scrollIntoView({ block: "start" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [editingDocument]);

  const updateDocument = (document: TravelDocument) => {
    setData((current) => ({
      ...current,
      documents: current.documents.map((item) => (item.id === document.id ? document : item)),
      dayPlans: current.dayPlans.map((day) => ({
        ...day,
        documentIds: syncDocumentId(day.documentIds, document.id, day.id === document.linkedDayId),
      })),
      expenses: current.expenses.map((expense) => ({
        ...expense,
        documentIds: syncDocumentId(
          expense.documentIds,
          document.id,
          expense.id === document.linkedExpenseId
        ),
      })),
      transports: current.transports.map((transport) => ({
        ...transport,
        documentIds: syncDocumentId(
          transport.documentIds,
          document.id,
          transport.id === document.linkedTransportId
        ),
      })),
    }));
    setEditingDocument(null);
    setFeedback({ kind: "success", text: `Koppelingen voor ${document.fileName} zijn bijgewerkt.` });
  };

  const openBlob = async (document: TravelDocument, download: boolean) => {
    const action: DocumentAction = download ? "download" : "open";
    setBusyAction({ documentId: document.id, action });
    setFeedback(null);

    try {
      const blob = await getDocumentBlob(document.fileBlobKey);
      if (!blob) {
        throw new Error("Bestand niet gevonden in de lokale browseropslag.");
      }

      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      if (download) {
        anchor.download = document.fileName;
      } else {
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
      }
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), download ? 2_000 : 60_000);
    } catch (error) {
      setFeedback({ kind: "error", text: getDocumentStorageErrorMessage(error) });
    } finally {
      setBusyAction(null);
    }
  };

  const deleteDocument = async (document: TravelDocument) => {
    if (!window.confirm(`Wil je “${document.fileName}” verwijderen?`)) return;

    setBusyAction({ documentId: document.id, action: "delete" });
    setFeedback(null);
    try {
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
      setEditingDocument((current) => (current?.id === document.id ? null : current));
      setFeedback({ kind: "success", text: `${document.fileName} is lokaal verwijderd.` });
    } catch (error) {
      setFeedback({ kind: "error", text: getDocumentStorageErrorMessage(error) });
    } finally {
      setBusyAction(null);
    }
  };

  const feedbackMessage = feedback ? (
    <div
      className={`rounded-lg border px-4 py-3 text-sm font-semibold ${feedbackClasses[feedback.kind]}`}
      role={feedback.kind === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      {feedback.text}
    </div>
  ) : null;

  if (data.documents.length === 0) {
    return (
      <div className="space-y-4">
        {feedbackMessage}
        <EmptyState
          icon={FileText}
          title="Nog geen documenten toegevoegd."
          actionLabel="Document uploaden"
          onAction={() => window.document.getElementById("document-upload-input")?.click()}
        />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="space-y-4">
        {feedbackMessage}
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Geen documenten gevonden met deze zoekterm of filter.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feedbackMessage}

      {editingDocument ? (
        <div className="scroll-mt-64 md:scroll-mt-52" ref={formRegionRef}>
          <DocumentForm
            key={editingDocument.id}
            data={data}
            document={editingDocument}
            onCancel={() => setEditingDocument(null)}
            onSubmit={updateDocument}
          />
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {documents.map((document) => {
          const day = data.dayPlans.find(
            (item) => item.id === document.linkedDayId || item.documentIds.includes(document.id)
          );
          const destination = data.destinations.find((item) => item.id === document.linkedDestinationId);
          const expense = data.expenses.find(
            (item) => item.id === document.linkedExpenseId || item.documentIds.includes(document.id)
          );
          const transport = data.transports.find(
            (item) => item.id === document.linkedTransportId || item.documentIds.includes(document.id)
          );
          const documentIsBusy = busyAction?.documentId === document.id;
          const actionsAreBusy = busyAction !== null;

          return (
            <article className="panel" key={document.id} aria-busy={documentIsBusy}>
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
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {document.size > 0 ? formatFileSize(document.size) : "Grootte onbekend"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="icon-btn disabled:cursor-wait disabled:opacity-50"
                    type="button"
                    title="Openen"
                    aria-label={`${document.fileName} openen`}
                    disabled={actionsAreBusy}
                    onClick={() => void openBlob(document, false)}
                  >
                    {busyAction?.documentId === document.id && busyAction.action === "open" ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <FileText size={16} />
                    )}
                  </button>
                  <button
                    className="icon-btn disabled:cursor-wait disabled:opacity-50"
                    type="button"
                    title="Downloaden"
                    aria-label={`${document.fileName} downloaden`}
                    disabled={actionsAreBusy}
                    onClick={() => void openBlob(document, true)}
                  >
                    {busyAction?.documentId === document.id && busyAction.action === "download" ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Download size={16} />
                    )}
                  </button>
                  <button
                    className="icon-btn disabled:opacity-50"
                    type="button"
                    title="Document bewerken"
                    aria-label={`${document.fileName} bewerken`}
                    disabled={actionsAreBusy}
                    onClick={() => setEditingDocument(document)}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="icon-btn text-rose-600 disabled:cursor-wait disabled:opacity-50"
                    type="button"
                    title="Document verwijderen"
                    aria-label={`${document.fileName} verwijderen`}
                    disabled={actionsAreBusy}
                    onClick={() => void deleteDocument(document)}
                  >
                    {busyAction?.documentId === document.id && busyAction.action === "delete" ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Trash2 size={16} />
                    )}
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
                  <dt className="label">Vervoer</dt>
                  <dd className="mt-1 text-slate-700">
                    {transport ? `${transport.from} → ${transport.to}` : "-"}
                  </dd>
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
