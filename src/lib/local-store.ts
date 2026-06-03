import { createId } from "@/lib/utils";
import { requestToPromise, withStore } from "@/lib/idb";
import type {
  EntryStoreName,
  MealEntry,
  MetaRecord,
  ProfileRecord,
  SyncQueueItem,
  WeightEntry,
  WorkoutEntry
} from "@/lib/types";

type StoreRecordMap = {
  profiles: ProfileRecord;
  weight_entries: WeightEntry;
  meal_entries: MealEntry;
  workout_entries: WorkoutEntry;
};

export async function listRecords<T>(storeName: EntryStoreName): Promise<T[]> {
  return withStore(storeName, "readonly", async (store) => {
    const all = await requestToPromise(store.getAll());
    return all as T[];
  });
}

export async function putRecord<T>(storeName: EntryStoreName, value: T) {
  return withStore(storeName, "readwrite", async (store) => {
    await requestToPromise(store.put(value));
  });
}

export async function putManyRecords<T>(storeName: EntryStoreName, values: T[]) {
  return withStore(storeName, "readwrite", async (store) => {
    for (const value of values) {
      await requestToPromise(store.put(value));
    }
  });
}

export async function getRecord<T>(storeName: EntryStoreName, id: string) {
  return withStore(storeName, "readonly", async (store) => {
    const item = await requestToPromise(store.get(id));
    return (item as T | undefined) ?? null;
  });
}

export async function upsertMeta(record: MetaRecord) {
  return withStore("meta", "readwrite", async (store) => {
    await requestToPromise(store.put(record));
  });
}

export async function readMeta(key: string) {
  return withStore("meta", "readonly", async (store) => {
    const value = await requestToPromise(store.get(key));
    return (value as MetaRecord | undefined) ?? null;
  });
}

export async function enqueueSync(storeName: EntryStoreName, recordId: string) {
  const item: SyncQueueItem = {
    id: createId(),
    record_id: recordId,
    store_name: storeName,
    operation: "upsert",
    enqueued_at: new Date().toISOString(),
    last_error: null
  };

  return withStore("sync_queue", "readwrite", async (store) => {
    await requestToPromise(store.put(item));
  });
}

export async function listQueueItems() {
  return withStore("sync_queue", "readonly", async (store) => {
    const items = await requestToPromise(store.getAll());
    return (items as SyncQueueItem[]).sort((left, right) =>
      left.enqueued_at.localeCompare(right.enqueued_at)
    );
  });
}

export async function removeQueueItem(id: string) {
  return withStore("sync_queue", "readwrite", async (store) => {
    await requestToPromise(store.delete(id));
  });
}

export async function updateQueueError(id: string, message: string) {
  return withStore("sync_queue", "readwrite", async (store) => {
    const current = (await requestToPromise(store.get(id))) as SyncQueueItem | undefined;
    if (!current) {
      return;
    }

    current.last_error = message;
    await requestToPromise(store.put(current));
  });
}
