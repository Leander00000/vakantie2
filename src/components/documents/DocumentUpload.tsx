import type { Dispatch, SetStateAction } from "react";
import { useRef, useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import { createId } from "../../data/emptyTrip";
import {
  formatFileSize,
  getDocumentStorageErrorMessage,
  MAX_DOCUMENT_SIZE_BYTES,
  saveDocumentBlob,
} from "../../lib/documentStorage";
import { documentTypes, type AppData, type DocumentType, type TravelDocument } from "../../types";

interface DocumentUploadProps {
  setData: Dispatch<SetStateAction<AppData>>;
}

interface UploadFeedback {
  kind: "success" | "warning" | "error" | "info";
  text: string;
}

const feedbackClasses: Record<UploadFeedback["kind"], string> = {
  success: "border-mint-200 bg-mint-50 text-mint-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  error: "border-rose-200 bg-rose-50 text-rose-800",
  info: "border-slate-200 bg-slate-50 text-slate-700",
};

export const DocumentUpload = ({ setData }: DocumentUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadLockRef = useRef(false);
  const [documentType, setDocumentType] = useState<DocumentType>("Overig");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<UploadFeedback | null>(null);

  const uploadFiles = async (files: FileList | File[]) => {
    if (uploadLockRef.current) return;

    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const oversizedFiles = fileArray.filter((file) => file.size > MAX_DOCUMENT_SIZE_BYTES);
    const acceptedFiles = fileArray.filter((file) => file.size <= MAX_DOCUMENT_SIZE_BYTES);
    if (acceptedFiles.length === 0) {
      setFeedback({
        kind: "error",
        text: `Geen bestanden toegevoegd. De maximale bestandsgrootte is ${formatFileSize(MAX_DOCUMENT_SIZE_BYTES)} per document.`,
      });
      return;
    }

    uploadLockRef.current = true;
    setIsUploading(true);
    setFeedback({
      kind: "info",
      text: `${acceptedFiles.length} document(en) lokaal opslaan…`,
    });

    try {
      const uploadedDocuments: TravelDocument[] = [];
      const uploadErrors: string[] = [];
      const selectedDocumentType = documentType;

      for (const file of acceptedFiles) {
        const fileBlobKey = createId("blob");
        try {
          await saveDocumentBlob(fileBlobKey, file);
          uploadedDocuments.push({
            id: createId("doc"),
            fileName: file.name,
            fileType: file.type || "application/octet-stream",
            documentType: selectedDocumentType,
            linkedDayId: "",
            linkedDestinationId: "",
            linkedExpenseId: "",
            linkedTransportId: "",
            uploadedAt: new Date().toISOString(),
            notes: "",
            fileBlobKey,
            size: file.size,
          });
        } catch (error) {
          uploadErrors.push(`${file.name}: ${getDocumentStorageErrorMessage(error)}`);
        }
      }

      if (uploadedDocuments.length > 0) {
        setData((current) => ({
          ...current,
          documents: [...uploadedDocuments, ...current.documents],
        }));
      }

      const issueMessages: string[] = [];
      if (oversizedFiles.length > 0) {
        const names = oversizedFiles
          .slice(0, 3)
          .map((file) => file.name)
          .join(", ");
        const extraCount = oversizedFiles.length - 3;
        issueMessages.push(
          `${oversizedFiles.length} te groot (${names}${extraCount > 0 ? ` en ${extraCount} andere` : ""})`
        );
      }
      if (uploadErrors.length > 0) {
        issueMessages.push(uploadErrors.join(" "));
      }

      if (uploadedDocuments.length > 0 && issueMessages.length === 0) {
        setFeedback({
          kind: "success",
          text: `${uploadedDocuments.length} document(en) lokaal toegevoegd.`,
        });
      } else if (uploadedDocuments.length > 0) {
        setFeedback({
          kind: "warning",
          text: `${uploadedDocuments.length} document(en) toegevoegd. Niet toegevoegd: ${issueMessages.join(" ")}`,
        });
      } else {
        setFeedback({
          kind: "error",
          text: `Upload mislukt. ${issueMessages.join(" ")}`,
        });
      }
    } finally {
      uploadLockRef.current = false;
      setIsUploading(false);
    }
  };

  return (
    <div className="panel space-y-4" aria-busy={isUploading}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-950">Document uploaden</h3>
          <p className="text-sm text-slate-500">
            Bestanden blijven in deze browser. Maximaal {formatFileSize(MAX_DOCUMENT_SIZE_BYTES)} per bestand.
          </p>
        </div>
        <label className="md:w-64">
          <span className="label">Documenttype</span>
          <select
            className="input mt-1"
            value={documentType}
            disabled={isUploading}
            onChange={(event) => setDocumentType(event.target.value as DocumentType)}
          >
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div
        className={`rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
          isDragging ? "border-mint-400 bg-mint-50" : "border-slate-300 bg-slate-50"
        } ${isUploading ? "cursor-wait opacity-70" : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!isUploading) setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (!isUploading) void uploadFiles(event.dataTransfer.files);
        }}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-mint-700 shadow-sm">
          {isUploading ? <Loader2 className="animate-spin" size={24} /> : <UploadCloud size={24} />}
        </div>
        <p className="mt-4 font-semibold text-slate-900">
          {isUploading ? "Documenten worden lokaal opgeslagen…" : "Sleep bestanden hierheen"}
        </p>
        <p className="mt-1 text-sm text-slate-500">of kies ze via de knop hieronder.</p>
        <button
          className="btn-primary mt-5"
          type="button"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? "Bezig met uploaden…" : "Document uploaden"}
        </button>
        <input
          ref={inputRef}
          id="document-upload-input"
          className="hidden"
          multiple
          type="file"
          disabled={isUploading}
          onChange={(event) => {
            const selectedFiles = event.target.files;
            event.target.value = "";
            if (selectedFiles) void uploadFiles(selectedFiles);
          }}
        />
      </div>

      {feedback ? (
        <p
          className={`rounded-lg border px-4 py-3 text-sm font-semibold ${feedbackClasses[feedback.kind]}`}
          role={feedback.kind === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {feedback.text}
        </p>
      ) : null}
    </div>
  );
};
