import { useEffect, useRef, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { TripSetupForm } from "./components/TripSetupForm";
import { createDataForTrip, createEmptyData, generateDayPlans } from "./data/emptyTrip";
import {
  blobToDataUrl,
  clearDocumentBlobs,
  dataUrlToBlob,
  getDocumentStorageErrorMessage,
  getDocumentBlob,
  MAX_DOCUMENT_BACKUP_BYTES,
  MAX_DOCUMENT_SIZE_BYTES,
  replaceDocumentBlobsAtomically,
  type DocumentBlobEntry,
} from "./lib/documentStorage";
import {
  clearData,
  isImportableAppData,
  loadData,
  normalizeData,
  saveData,
} from "./lib/storage";
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
  version: 1 | 2;
  exportedAt: string;
  data: AppData;
  documentFiles: ExportedDocumentFile[];
}

interface ParsedImport {
  data: AppData;
  documentFiles: ExportedDocumentFile[];
  legacyRaw: boolean;
}

const MAX_IMPORT_JSON_BYTES = Math.ceil((MAX_DOCUMENT_BACKUP_BYTES * 4) / 3) + 5 * 1024 * 1024;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isExportedDocumentFile = (value: unknown): value is ExportedDocumentFile =>
  isRecord(value) &&
  typeof value.fileBlobKey === "string" &&
  value.fileBlobKey.length > 0 &&
  typeof value.fileName === "string" &&
  typeof value.fileType === "string" &&
  typeof value.dataUrl === "string" &&
  value.dataUrl.startsWith("data:");

const parseImport = (value: unknown): ParsedImport | null => {
  if (
    isRecord(value) &&
    value.schema === "reisplanner-export" &&
    (value.version === 1 || value.version === 2)
  ) {
    if (
      !isImportableAppData(value.data) ||
      !Array.isArray(value.documentFiles) ||
      !value.documentFiles.every(isExportedDocumentFile)
    ) {
      return null;
    }
    return {
      data: normalizeData(value.data),
      documentFiles: value.documentFiles,
      legacyRaw: false,
    };
  }

  if (!isImportableAppData(value)) return null;
  return { data: normalizeData(value), documentFiles: [], legacyRaw: true };
};

const assertDocumentBackupMatches = (parsed: ParsedImport) => {
  const metadataKeys = parsed.data.documents.map((document) => document.fileBlobKey);
  if (metadataKeys.some((key) => !key) || new Set(metadataKeys).size !== metadataKeys.length) {
    throw new Error("De documentverwijzingen in deze back-up zijn ongeldig of dubbel.");
  }

  if (parsed.legacyRaw) return;
  const fileKeys = parsed.documentFiles.map((file) => file.fileBlobKey);
  if (new Set(fileKeys).size !== fileKeys.length) {
    throw new Error("Een documentbestand staat dubbel in deze back-up.");
  }
  const metadataKeySet = new Set(metadataKeys);
  const fileKeySet = new Set(fileKeys);
  if (
    metadataKeys.length !== fileKeys.length ||
    metadataKeys.some((key) => !fileKeySet.has(key)) ||
    fileKeys.some((key) => !metadataKeySet.has(key))
  ) {
    throw new Error("Deze back-up mist één of meer documentbestanden.");
  }
};

const decodeDocumentFiles = async (
  documentFiles: ExportedDocumentFile[]
): Promise<DocumentBlobEntry[]> => {
  const entries: DocumentBlobEntry[] = [];
  let totalSize = 0;

  for (const documentFile of documentFiles) {
    const decodedBlob = await dataUrlToBlob(documentFile.dataUrl);
    if (decodedBlob.size > MAX_DOCUMENT_SIZE_BYTES) {
      throw new Error(`Document “${documentFile.fileName}” is groter dan de limiet van 20 MB.`);
    }
    totalSize += decodedBlob.size;
    if (totalSize > MAX_DOCUMENT_BACKUP_BYTES) {
      throw new Error("De documenten in deze back-up zijn samen groter dan de limiet van 100 MB.");
    }
    entries.push({
      key: documentFile.fileBlobKey,
      blob:
        documentFile.fileType && decodedBlob.type !== documentFile.fileType
          ? new Blob([decodedBlob], { type: documentFile.fileType })
          : decodedBlob,
    });
  }

  return entries;
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

const dayHasMeaningfulContent = (day: AppData["dayPlans"][number]) =>
  day.status !== "leeg" ||
  Boolean(
    day.location.trim() ||
      day.dayType ||
      day.transportIds.length ||
      day.activityIds.length ||
      day.accommodation.trim() ||
      day.activities.trim() ||
      day.meals.trim() ||
      day.estimatedCost ||
      day.bookingStatus !== "geen" ||
      day.documentIds.length ||
      day.expenseIds.length ||
      day.notes.trim()
  );

function App() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [activeTab, setActiveTab] = useState<TabKey>("planner");
  const [importMessage, setImportMessage] = useState("");
  const [showTripEditor, setShowTripEditor] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const importInputRef = useRef<HTMLInputElement>(null);

  const clearAllStoredData = async () => {
    if (!clearData()) {
      setImportMessage("Wissen mislukt: de browser blokkeert de lokale reisopslag.");
      return false;
    }

    try {
      await clearDocumentBlobs();
      return true;
    } catch (error) {
      const restored = saveData(data);
      setImportMessage(
        restored
          ? `Wissen mislukt: ${getDocumentStorageErrorMessage(error)} De bestaande reis is behouden.`
          : `Wissen mislukt: ${getDocumentStorageErrorMessage(error)} Herlaad de pagina niet voordat je een back-up hebt gemaakt.`
      );
      return false;
    }
  };

  useEffect(() => {
    setSaveState("saving");
    const timeout = window.setTimeout(() => {
      setSaveState(saveData(data) ? "saved" : "error");
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [data]);

  useEffect(() => {
    if (!importMessage) return;
    const timeout = window.setTimeout(() => setImportMessage(""), 6000);
    return () => window.clearTimeout(timeout);
  }, [importMessage]);

  const handleCreateTrip = (input: TripSetupInput) => {
    setData(createDataForTrip(input));
    setActiveTab("planner");
    setShowTripEditor(false);
  };

  const handleUpdateTrip = (input: TripSetupInput) => {
    if (!data.trip) return;
    const removedFilledDays = data.dayPlans.filter(
      (day) =>
        (day.date < input.startDate || day.date > input.endDate) &&
        dayHasMeaningfulContent(day)
    );
    if (
      removedFilledDays.length > 0 &&
      !window.confirm(
        `${removedFilledDays.length} ingevulde dag(en) vallen buiten de nieuwe datumrange en worden verwijderd. Doorgaan?`
      )
    ) {
      return;
    }

    setData((current) => {
      if (!current.trip) return current;
      const travelerCount = Math.max(1, Math.min(20, input.travelers || 1));
      const travelerNames = Array.from(
        { length: travelerCount },
        (_, index) => input.travelerNames[index]?.trim() || `Reiziger ${index + 1}`
      );
      const renamedTravelers = new Map(
        current.trip.travelerNames.map((name, index) => [name, travelerNames[index] ?? ""])
      );
      const dayPlans = generateDayPlans(input.startDate, input.endDate, current.dayPlans);
      const validDayIds = new Set(dayPlans.map((day) => day.id));
      return {
        ...current,
        trip: {
          ...current.trip,
          name: input.name.trim(),
          startDate: input.startDate,
          endDate: input.endDate,
          travelers: travelerCount,
          travelerNames,
          currency: input.currency,
          totalBudget: input.totalBudget,
          notes: input.notes.trim(),
        },
        dayPlans,
        expenses: current.expenses.map((expense) => ({
          ...expense,
          currency: input.currency,
          dayId: validDayIds.has(expense.dayId) ? expense.dayId : "",
          paidBy: renamedTravelers.get(expense.paidBy) || expense.paidBy,
          splitBetween: expense.splitBetween
            .map((name) => renamedTravelers.get(name) || name)
            .filter((name) => travelerNames.includes(name)),
        })),
        packingItems: current.packingItems.map((item) => ({
          ...item,
          assignedTo: item.assignedTo
            .map((name) => renamedTravelers.get(name) || name)
            .filter((name) => travelerNames.includes(name)),
        })),
        documents: current.documents.map((document) => ({
          ...document,
          linkedDayId: validDayIds.has(document.linkedDayId) ? document.linkedDayId : "",
        })),
      };
    });
    setShowTripEditor(false);
  };

  const handleNewTrip = async () => {
    if (data.trip && !window.confirm("Wil je een nieuwe lege reis starten? De huidige lokale data wordt vervangen.")) {
      return;
    }
    if (!(await clearAllStoredData())) return;
    setData(createEmptyData());
    setActiveTab("planner");
    setShowTripEditor(false);
    setImportMessage("Nieuwe lege reis gestart.");
  };

  const handleReset = async () => {
    if (!window.confirm("Weet je zeker dat je alle lokale reisdata en documentbestanden wilt verwijderen?")) {
      return;
    }
    if (!(await clearAllStoredData())) return;
    setData(createEmptyData());
    setImportMessage("Alle lokale reisdata en documenten zijn verwijderd.");
    setActiveTab("planner");
    setShowTripEditor(false);
  };

  const handleExport = async () => {
    if (!data.trip) return;

    try {
      const documentFiles: ExportedDocumentFile[] = [];
      let totalDocumentSize = 0;
      for (const documentItem of data.documents) {
        const blob = await getDocumentBlob(documentItem.fileBlobKey);
        if (!blob) {
          throw new Error(`Document “${documentItem.fileName}” ontbreekt in de lokale opslag.`);
        }
        if (blob.size > MAX_DOCUMENT_SIZE_BYTES) {
          throw new Error(`Document “${documentItem.fileName}” is groter dan de limiet van 20 MB.`);
        }
        totalDocumentSize += blob.size;
        if (totalDocumentSize > MAX_DOCUMENT_BACKUP_BYTES) {
          throw new Error("De documenten zijn samen groter dan de back-uplimiet van 100 MB.");
        }
        documentFiles.push({
          fileBlobKey: documentItem.fileBlobKey,
          fileName: documentItem.fileName,
          fileType: documentItem.fileType,
          dataUrl: await blobToDataUrl(blob),
        });
      }

      downloadJson({
        schema: "reisplanner-export",
        version: 2,
        exportedAt: new Date().toISOString(),
        data,
        documentFiles,
      } satisfies ExportPayload);
      setImportMessage("Back-up gedownload.");
    } catch (error) {
      setImportMessage(
        `Back-up mislukt: ${
          error instanceof Error ? error.message : getDocumentStorageErrorMessage(error)
        }`
      );
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_IMPORT_JSON_BYTES) {
      setImportMessage("Import mislukt: het back-upbestand is te groot.");
      return;
    }

    if (
      data.trip &&
      !window.confirm("Importeren vervangt de bestaande reisdata in deze browser. Wil je doorgaan?")
    ) {
      return;
    }

    try {
      const parsed: unknown = JSON.parse(await file.text());
      const imported = parseImport(parsed);
      if (!imported) {
        throw new Error("Dit bestand heeft geen geldige Reisplanner-structuur.");
      }
      assertDocumentBackupMatches(imported);
      const documentBlobs = await decodeDocumentFiles(imported.documentFiles);

      if (!saveData(imported.data)) {
        throw new Error("De browser kon de geïmporteerde reis niet lokaal opslaan.");
      }
      try {
        await replaceDocumentBlobsAtomically(documentBlobs);
      } catch (error) {
        const restored = saveData(data);
        throw new Error(
          restored
            ? `${getDocumentStorageErrorMessage(error)} De bestaande reis is behouden.`
            : `${getDocumentStorageErrorMessage(error)} De vorige lokale reisdata kon niet worden hersteld.`
        );
      }

      setData(imported.data);
      setActiveTab("planner");
      setShowTripEditor(false);
      setImportMessage(
        imported.legacyRaw && imported.data.documents.length > 0
          ? "Import voltooid. Let op: deze oude export bevat alleen documentgegevens, niet de lokale bestanden zelf."
          : "Import voltooid."
      );
    } catch (error) {
      setImportMessage(
        `Import mislukt: ${error instanceof Error ? error.message : "controleer het JSON-bestand."}`
      );
    }
  };

  const page = data.trip ? (
    <>
      {activeTab === "planner" ? (
        <PlannerPage data={data} setData={setData} onTabChange={setActiveTab} />
      ) : null}
      {activeTab === "budget" ? <BudgetPage data={data} setData={setData} /> : null}
      {activeTab === "packing" ? <PackingPage data={data} setData={setData} /> : null}
      {activeTab === "documents" ? <DocumentsPage data={data} setData={setData} /> : null}
    </>
  ) : (
    <TripSetupForm onCreate={handleCreateTrip} />
  );
  const noticeIsError = /mislukt|niet worden|niet beschikbaar/i.test(importMessage);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="min-w-0 md:pl-64">
        <Header
          data={data}
          saveState={saveState}
          onEditTrip={() => setShowTripEditor(true)}
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
        <main className="px-4 pb-28 pt-6 sm:px-6 lg:px-8 md:pb-8">
          {importMessage ? (
            <div
              className={`mb-4 rounded-xl border px-4 py-3 text-sm font-semibold ${
                noticeIsError
                  ? "border-rose-200 bg-rose-50 text-rose-800"
                  : "border-mint-200 bg-mint-50 text-mint-800"
              }`}
              role="status"
            >
              {importMessage}
            </div>
          ) : null}
          {showTripEditor && data.trip ? (
            <TripSetupForm
              initial={{
                name: data.trip.name,
                startDate: data.trip.startDate,
                endDate: data.trip.endDate,
                travelers: data.trip.travelers,
                travelerNames: data.trip.travelerNames,
                currency: data.trip.currency,
                totalBudget: data.trip.totalBudget,
                notes: data.trip.notes,
              }}
              mode="edit"
              onCancel={() => setShowTripEditor(false)}
              onCreate={handleUpdateTrip}
            />
          ) : (
            page
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
