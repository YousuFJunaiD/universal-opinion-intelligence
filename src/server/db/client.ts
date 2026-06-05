import { Pool, type QueryResultRow } from "pg";

let pool: Pool | undefined;

export function getDbPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required when API mode uses PostgreSQL.");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      ssl: shouldUseSsl() ? { rejectUnauthorized: false } : undefined
    });
  }

  return pool;
}

export async function query<TRecord extends QueryResultRow>(
  sql: string,
  values: unknown[] = []
) {
  const result = await getDbPool().query<TRecord>(sql, values);
  return result;
}

function shouldUseSsl() {
  return (
    process.env.DATABASE_URL?.includes("supabase.co") ||
    process.env.DATABASE_URL?.includes("pooler.supabase.com") ||
    process.env.PGSSLMODE === "require"
  );
}
