import { readFile, readdir } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
if (!process.env.DATABASE_URL)
  throw Error("Set DATABASE_URL before applying migrations.");
const sql = neon(process.env.DATABASE_URL);
// Migration files contain ordinary PostgreSQL DDL, without procedural blocks.
for (const name of (await readdir("db"))
  .filter((n) => n.endsWith(".sql"))
  .sort()) {
  const text = (await readFile("db/" + name, "utf8")).replace(/^--.*$/gm, "");
  for (const statement of text
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean))
    await sql.query(statement);
  console.log("Applied", name);
}
