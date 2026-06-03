import type { SupabaseClient } from "@supabase/supabase-js";
import { formatCloudErrorMessage } from "@/lib/cloud-errors";
import {
  getRecord,
  listRecords,
  listQueueItems,
  putManyRecords,
  putRecord,
  removeQueueItem,
  updateQueueError,
  upsertMeta
} from "@/lib/local-store";
import type {
  EntryStoreName,
  ProfileRecord,
  SyncQueueItem,
} from "@/lib/types";

async function pushQueueItem(client: SupabaseClient, item: SyncQueueItem) {
  const record = await getRecord(item.store_name, item.record_id);

  if (!record) {
    await removeQueueItem(item.id);
    return;
  }

  const { error } = await client.from(item.store_name).upsert(record).select("id").single();

  if (error) {
    await updateQueueError(item.id, error.message);
    throw error;
  }

  await removeQueueItem(item.id);
}

async function pullScopedRecords(client: SupabaseClient, currentUserId: string) {
  const { data: currentProfile, error: profileError } = await client
    .from("profiles")
    .select("*")
    .eq("id", currentUserId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (currentProfile) {
    await putRecord("profiles", currentProfile as ProfileRecord);
  }

  const visibleUserIds = currentProfile?.buddy_id
    ? [currentUserId, currentProfile.buddy_id]
    : [currentUserId];

  const { data: visibleProfiles, error: visibleProfilesError } = await client
    .from("profiles")
    .select("*")
    .in("id", visibleUserIds)
    .order("updated_at", { ascending: false });

  if (visibleProfilesError) {
    throw visibleProfilesError;
  }

  await putManyRecords("profiles", (visibleProfiles ?? []) as ProfileRecord[]);

  const entryTables: EntryStoreName[] = ["weight_entries", "meal_entries", "workout_entries"];

  for (const table of entryTables) {
    const { data, error } = await client
      .from(table)
      .select("*")
      .in("user_id", visibleUserIds)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    await putManyRecords(table, data ?? []);
  }
}

export async function syncAll(client: SupabaseClient, currentUserId: string) {
  const queue = await listQueueItems();

  for (const item of queue) {
    await pushQueueItem(client, item);
  }

  await pullScopedRecords(client, currentUserId);

  await upsertMeta({
    key: "last_sync_at",
    value: new Date().toISOString()
  });
}

export async function seedProfileIfMissing(client: SupabaseClient, profile: ProfileRecord) {
  const localProfiles = await listRecords<ProfileRecord>("profiles");
  const alreadyExists = localProfiles.some((entry) => entry.id === profile.id);

  if (!alreadyExists) {
    await putRecord("profiles", profile);
  }

  const { data, error } = await client.from("profiles").select("id").eq("id", profile.id).maybeSingle();
  if (error) {
    throw new Error(formatCloudErrorMessage(error));
  }

  if (!data) {
    const { error: insertError } = await client.from("profiles").insert(profile);

    if (insertError) {
      throw new Error(formatCloudErrorMessage(insertError));
    }
  }
}
