import { handle, session, json } from "@/lib/security";
import { db } from "@/lib/db";
export async function GET(request: Request) {
  return handle(async () => {
    const who = session(request);
    const sql = db();
    const rows =
      await sql`SELECT id,kind,created_at,payload FROM reports WHERE owner=${who.sub} ORDER BY created_at DESC LIMIT 30`;
    return json({ reports: rows });
  });
}
