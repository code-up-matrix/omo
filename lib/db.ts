import { neon } from "@neondatabase/serverless";
import { AppError, required } from "./security";
export function db() {
  return neon(required("DATABASE_URL"));
}
export async function rateLimit(key: string, limit = 20) {
  const sql = db();
  const bucket = Math.floor(Date.now() / 60000);
  const rows =
    await sql`INSERT INTO rate_limits (key,bucket,hits) VALUES (${key},${bucket},1) ON CONFLICT (key,bucket) DO UPDATE SET hits=rate_limits.hits+1 RETURNING hits`;
  if (Number(rows[0].hits) > limit)
    throw new AppError(429, "Too many requests. Please try again in a minute.");
}
export async function saveReport(
  owner: string,
  kind: string,
  payload: unknown,
) {
  const sql = db();
  const rows =
    await sql`INSERT INTO reports(owner,kind,payload) VALUES(${owner},${kind},${JSON.stringify(payload)}::jsonb) RETURNING id,created_at`;
  return rows[0];
}
