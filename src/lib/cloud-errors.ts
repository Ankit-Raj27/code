export function formatCloudErrorMessage(error: unknown) {
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unable to sync right now.";

  if (rawMessage.includes("Could not find the table 'public.profiles' in the schema cache")) {
    return "Supabase is connected, but the `profiles` table is not available yet. Run the SQL in `supabase/migrations/001_initial.sql` in your Supabase SQL editor, then refresh the app.";
  }

  if (rawMessage.includes("schema cache")) {
    return "Supabase is connected, but the database schema is not ready for this app yet. Run the SQL in `supabase/migrations/001_initial.sql`, wait a few seconds, then refresh.";
  }

  return rawMessage;
}
