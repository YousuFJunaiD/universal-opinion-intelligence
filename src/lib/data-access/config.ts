export type DataAccessMode = "local" | "postgres";

export const DATA_ACCESS_MODE: DataAccessMode =
  process.env.DATA_ACCESS_MODE === "postgres" ||
  process.env.DATA_ACCESS_MODE === "api" ||
  process.env.NEXT_PUBLIC_DATA_MODE === "api"
    ? "postgres"
    : "local";

export function isPostgresMode() {
  return DATA_ACCESS_MODE === "postgres";
}
