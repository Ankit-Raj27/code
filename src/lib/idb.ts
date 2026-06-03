import { DB_NAME, DB_VERSION } from "@/lib/constants";
import type { StoreName } from "@/lib/types";

const STORES: StoreName[] = [
  "profiles",
  "weight_entries",
  "meal_entries",
  "workout_entries",
  "meta",
  "sync_queue"
];

export async function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, {
            keyPath: store === "meta" ? "key" : "id"
          });
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function withStore<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  runner: (store: IDBObjectStore) => Promise<T>
) {
  const db = await openDb();

  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);

    runner(store)
      .then((result) => {
        tx.oncomplete = () => resolve(result);
      })
      .catch(reject);

    tx.onerror = () => reject(tx.error);
  });
}

export function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
