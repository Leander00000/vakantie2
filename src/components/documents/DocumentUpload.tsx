import type { Dispatch, SetStateAction } from "react";
import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { createId } from "../../data/emptyTrip";
import { saveDocumentBlob } from "../../lib/documentStorage";
import { documentTypes, type AppData, type DocumentType, type TravelDocument } from "../../types";

interface DocumentUploadProps {
  setData: Dispatch<SetStateAction<AppData>>;
}

export const DocumentUpload = ({ setData }: DocumentUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState<DocumentType>("Overig");
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState("");

  const uploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const uploadedDocuments: TravelDocument[] = [];
    for (const file of fileArray) {
      const id = createId("doc");
      const fileBlobKey = createId("blob");
      await saveDocumentBlob(fileBlobKey, file);
      uploadedDocuments.push({
        id,
        fileName: file.name,
        fileType: file.type || "onbekend",
        documentType,
        linkedDayId: "",
        linkedDestinationId: "",
        linkedExpenseId: "",
        uploadedAt: new Date().toISOString(),
        notes: "",
        fileBlobKey,
      });
    }

    setData((current) => ({
      ...current,
      documents: [...uploadedDocuments, ...current.documents],
    }));
    setMessage(`${uploadedDocuments.length} document(en) toegevoegd.`);
  };

  return (
    <div className="panel space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-950">Document uploaden</h3>
          <p className="text-sm text-slate-500">Bestanden worden lokaal in deze browser opgeslagen.</p>
        </div>
        <label className="md:w-64">
          <span className="label">Documenttype</span>
          <select
            className="input mt-1"
            value={documentType}
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
        }`}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void uploadFiles(event.dataTransfer.files);
        }}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-mint-700 shadow-sm">
          <UploadCloud size={24} />
        </div>
        <p className="mt-4 font-semibold text-slate-900">Sleep bestanden hierheen</p>
        <p className="mt-1 text-sm text-slate-500">of kies ze via de knop hieronder.</p>
        <button className="btn-primary mt-5" type="button" onClick={() => inputRef.current?.click()}>
          Document uploaden
        </button>
        <input
          ref={inputRef}
          id="document-upload-input"
          className="hidden"
          multiple
          type="file"
          onChange={(event) => {
            if (event.target.files) void uploadFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {message ? <p className="text-sm font-semibold text-mint-800">{message}</p> : null}
    </div>
  );
};
