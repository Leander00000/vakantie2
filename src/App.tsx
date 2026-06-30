import { useEffect, useRef, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { TripSetupForm } from "./components/TripSetupForm";
import { createDataForTrip, createEmptyData } from "./data/emptyTrip";
import {
  blobToDataUrl,
  clearDocumentBlobs,
  dataUrlToBlob,
  getDocumentBlob,
  saveDocumentBlob,
} from "./lib/documentStorage";
import { clearData, loadData, normalizeData, saveData } from "./lib/storage";
import { BudgetPage } from "./pages/BudgetPage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { PackingPage } from "./pages/PackingPage";
import { PlannerPage } from "./pages/PlannerPage";
import type { AppData, TabKey, TripSetupInput } from "./types";

interface ExportedDocumentFile {
  fileBlobKey: string;
  fileName: string;
  fileType: string;
  dataUrl: string;
}

interface ExportPayload {
  schema: "reisplanner-export";
  version: 1;
  exportedAt: string;
  data: AppData;
  documentFiles: ExportedDocumentFile[];
}

const isExportPayload = (value: unknown): value is ExportPayload => {
  const candidate = value as Partial<ExportPayload> | null;
  return candidate?.schema === "reisplanner-export" && candidate.version === 1 && !!candidate.data;
};

const downloadJson = (payload: unknown) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `reisplanner-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

function App() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [activeTab, setActiveTab] = useState<TabKey>("planner");
  const [importMessage, setImportMessage] = useState("");
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const handleCreateTrip = (input: TripSetupInput) => {
    setData(createDataForTrip(input));
    setActiveTab("planner");
  };

  const handleNewTrip = async () => {
    if (data.trip && !window.confirm("Wil je een nieuwe lege reis starten? De huidige lokale data wordt vervangen.")) {
      return;
    }
    await clearDocumentBlobs();
    clearData();
    setData(createEmptyData());
    setActiveTab("planner");
  };

  const handleReset = async () => {
    if (!window.confirm("Weet je zeker dat je alle lokale reisdata en documentbestanden wilt verwijderen?")) {
      return;
    }
    await clearDocumentBlobs();
    clearData();
    setData(createEmptyData());
    setImportMessage("");
    setActiveTab("planner");
  };

  const handleExport = async () => {
    if (!data.trip) return;

    const documentFiles: ExportedDocumentFile[] = [];
    for (const documentItem of data.documents) {
      const blob = await getDocumentBlob(documentItem.fileBlobKey);
      if (blob) {
        documentFiles.push({
          fileBlobKey: documentItem.fileBlobKey,
          fileName: documentItem.fileName,
          fileType: documentItem.fileType,
          dataUrl: await blobToDataUrl(blob),
        });
      }
    }

    downloadJson({
      schema: "reisplanner-export",
      version: 1,
      exportedAt: new Date().toISOString(),
      data,
      documentFiles,
    } satisfies ExportPayload);
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (
      data.trip &&
      !window.confirm("Importeren vervangt de bestaande reisdata in deze browser. Wil je doorgaan?")
    ) {
      return;
    }

    try {
      const parsed: unknown = JSON.parse(await file.text());
      const importedData = normalizeData(isExportPayload(parsed) ? parsed.data : parsed);
      const documentFiles = isExportPayload(parsed) ? parsed.documentFiles ?? [] : [];

      await clearDocumentBlobs();
      for (const documentFile of documentFiles) {
        const blob = await dataUrlToBlob(documentFile.dataUrl);
        const restoredFile = new File([blob], documentFile.fileName, {
          type: documentFile.fileType || blob.type,
        });
        await saveDocumentBlob(documentFile.fileBlobKey, restoredFile);
      }

      setData(importedData);
      setActiveTab("planner");
      setImportMessage("Import voltooid.");
    } catch {
      setImportMessage("Import mislukt. Controleer of dit een geldige Reisplanner JSON-export is.");
    }
  };

  const page = data.trip ? (
    <>
      {activeTab === "planner" ? <PlannerPage data={data} setData={setData} /> : null}
      {activeTab === "budget" ? <BudgetPage data={data} setData={setData} /> : null}
      {activeTab === "packing" ? <PackingPage data={data} setData={setData} /> : null}
      {activeTab === "documents" ? <DocumentsPage data={data} setData={setData} /> : null}
    </>
  ) : (
    <TripSetupForm onCreate={handleCreateTrip} />
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="md:pl-72">
        <Header
          data={data}
          onExport={handleExport}
          onImportClick={() => importInputRef.current?.click()}
          onNewTrip={handleNewTrip}
          onReset={handleReset}
        />
        <input
          ref={importInputRef}
          className="hidden"
          type="file"
          accept="application/json"
          onChange={handleImportFile}
        />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          {importMessage ? (
            <div className="mb-4 rounded-lg border border-mint-200 bg-mint-50 px-4 py-3 text-sm font-semibold text-mint-800">
              {importMessage}
            </div>
          ) : null}
          {page}
        </main>
      </div>
    </div>
  );
}

export default App;
