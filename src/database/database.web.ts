/**
 * Web fallback for database.
 * Prevents bundling wa-sqlite.wasm on Web builds since HydroReminder is a mobile phone app.
 */
export async function getDatabase(): Promise<null> {
  return null;
}
