const DB_NAME = "reisplanner-documenten";
const DB_VERSION = 1;
const STORE_NAME = "files";

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const runStoreAction = async <T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T> | void
) => {
  const database = await openDatabase();

  return new Promise<T | undefined>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = action(store);

    if (request) {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }

    transaction.oncomplete = () => {
      if (!request) resolve(undefined);
      database.close();
    };
    transaction.onerror = () => {
      reject(transaction.error);
      database.close();
    };
  });
};

export const saveDocumentBlob = async (key: string, file: File) => {
  await runStoreAction("readwrite", (store) => store.put(file, key));
};

export const getDocumentBlob = async (key: string) => {
  const result = await runStoreAction<Blob>("readonly", (store) => store.get(key));
  return result ?? null;
};

export const deleteDocumentBlob = async (key: string) => {
  await runStoreAction("readwrite", (store) => store.delete(key));
};

export const clearDocumentBlobs = async () => {
  await runStoreAction("readwrite", (store) => store.clear());
};

export const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

export const dataUrlToBlob = async (dataUrl: string) => {
  const response = await fetch(dataUrl);
  return response.blob();
};
