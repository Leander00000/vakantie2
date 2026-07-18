const DB_NAME = "reisplanner-documenten";
const DB_VERSION = 1;
const STORE_NAME = "files";

export const MAX_DOCUMENT_SIZE_BYTES = 20 * 1024 * 1024;
export const MAX_DOCUMENT_BACKUP_BYTES = 100 * 1024 * 1024;

export interface DocumentBlobEntry {
  key: string;
  blob: Blob;
}

const createStorageError = (message: string, cause?: unknown) => {
  const error = new Error(message);
  if (cause !== undefined) {
    (error as Error & { cause?: unknown }).cause = cause;
  }
  return error;
};

export const getDocumentStorageErrorMessage = (error: unknown) => {
  const name = typeof DOMException !== "undefined" && error instanceof DOMException ? error.name : "";

  if (name === "QuotaExceededError") {
    return "Er is onvoldoende lokale opslagruimte. Verwijder een bestand of kies een kleiner document.";
  }
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "De browser blokkeert lokale documentopslag. Controleer de privacy- of opslaginstellingen.";
  }
  if (name === "InvalidStateError") {
    return "De lokale documentopslag is tijdelijk niet beschikbaar. Herlaad de pagina en probeer opnieuw.";
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "De lokale documentopslag kon niet worden geopend.";
};

export const formatFileSize = (size: number) => {
  if (!Number.isFinite(size) || size < 0) return "Grootte onbekend";
  if (size === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"] as const;
  const unitIndex = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** unitIndex;
  return `${new Intl.NumberFormat("nl-NL", {
    maximumFractionDigits: value >= 10 || unitIndex === 0 ? 0 : 1,
  }).format(value)} ${units[unitIndex]}`;
};

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(createStorageError("Documentopslag wordt niet ondersteund in deze browser."));
      return;
    }

    let settled = false;
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      const database = request.result;
      if (settled) {
        database.close();
        return;
      }
      settled = true;
      database.onversionchange = () => database.close();
      resolve(database);
    };
    request.onerror = () =>
      fail(request.error ?? createStorageError("De lokale documentopslag kon niet worden geopend."));
    request.onblocked = () =>
      fail(
        createStorageError(
          "De lokale documentopslag wordt door een ander tabblad geblokkeerd. Sluit andere tabbladen met deze app en probeer opnieuw."
        )
      );
  });

const runStoreRequest = async <T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
  const database = await openDatabase();

  return new Promise<T>((resolve, reject) => {
    let settled = false;
    let request: IDBRequest<T> | null = null;
    let result!: T;

    const close = () => {
      database.close();
    };
    const succeed = () => {
      if (settled) return;
      settled = true;
      close();
      resolve(result);
    };
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      close();
      reject(error);
    };

    try {
      const transaction = database.transaction(STORE_NAME, mode);
      request = action(transaction.objectStore(STORE_NAME));

      request.onsuccess = () => {
        result = request?.result as T;
      };
      request.onerror = () => {
        // IndexedDB aborts the transaction by default. The transaction handlers
        // below close the database and surface the original request error.
      };
      transaction.oncomplete = succeed;
      transaction.onerror = () =>
        fail(
          request?.error ??
            transaction.error ??
            createStorageError("De bewerking in de lokale documentopslag is mislukt.")
        );
      transaction.onabort = () =>
        fail(
          request?.error ??
            transaction.error ??
            createStorageError("De bewerking in de lokale documentopslag is afgebroken.")
        );
    } catch (error) {
      fail(error);
    }
  });
};

export const saveDocumentBlob = async (key: string, blob: Blob): Promise<void> => {
  if (!key || !(blob instanceof Blob)) {
    throw createStorageError("Het document kon niet lokaal worden opgeslagen.");
  }
  await runStoreRequest("readwrite", (store) => store.put(blob, key));
};

export const getDocumentBlob = async (key: string): Promise<Blob | null> => {
  if (!key) return null;
  const result = await runStoreRequest<Blob | undefined>("readonly", (store) => store.get(key));
  return result ?? null;
};

export const deleteDocumentBlob = async (key: string): Promise<void> => {
  if (!key) return;
  await runStoreRequest("readwrite", (store) => store.delete(key));
};

export const clearDocumentBlobs = async (): Promise<void> => {
  await runStoreRequest("readwrite", (store) => store.clear());
};

/**
 * Replaces every locally stored document in one IndexedDB transaction. If a
 * clear or put fails, IndexedDB rolls the full transaction back and the old
 * document set remains available.
 */
export const replaceDocumentBlobsAtomically = async (
  entries: DocumentBlobEntry[]
): Promise<void> => {
  const seenKeys = new Set<string>();
  for (const entry of entries) {
    if (!entry.key || !(entry.blob instanceof Blob) || seenKeys.has(entry.key)) {
      throw createStorageError("De documentbestanden in de import zijn ongeldig of dubbel opgenomen.");
    }
    seenKeys.add(entry.key);
  }

  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    let requestError: DOMException | null = null;
    const close = () => database.close();
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      close();
      reject(error);
    };

    try {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const requests: IDBRequest[] = [store.clear()];
      entries.forEach((entry) => requests.push(store.put(entry.blob, entry.key)));
      requests.forEach((request) => {
        request.onerror = () => {
          requestError = request.error;
        };
      });

      transaction.oncomplete = () => {
        if (settled) return;
        settled = true;
        close();
        resolve();
      };
      transaction.onerror = () =>
        fail(
          requestError ??
            transaction.error ??
            createStorageError("De geïmporteerde documenten konden niet lokaal worden opgeslagen.")
        );
      transaction.onabort = () =>
        fail(
          requestError ??
            transaction.error ??
            createStorageError("Het vervangen van de lokale documenten is afgebroken.")
        );
    } catch (error) {
      fail(error);
    }
  });
};

export const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    if (typeof FileReader === "undefined") {
      reject(createStorageError("Dit document kan alleen in de browser worden geëxporteerd."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(reader.error ?? createStorageError("Het document kon niet worden gelezen voor export."));
    reader.onabort = () => reject(createStorageError("Het lezen van het document is afgebroken."));
    reader.readAsDataURL(blob);
  });

export const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  if (!dataUrl.startsWith("data:")) {
    throw createStorageError("Het geïmporteerde document bevat geen geldige lokale bestandsdata.");
  }

  try {
    const response = await fetch(dataUrl);
    if (!response.ok) {
      throw createStorageError("Het documentbestand in de import kon niet worden gelezen.");
    }
    return await response.blob();
  } catch (error) {
    throw createStorageError("Het documentbestand in de import kon niet worden hersteld.", error);
  }
};
