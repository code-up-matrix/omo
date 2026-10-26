import {
  createHmac,
  randomUUID,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { z } from "zod";
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function required(name: string) {
  const value = process.env[name];
  if (!value) throw new AppError(503, `${name} is not configured.`);
  return value;
}
function secret() {
  const value = required("SESSION_SECRET");
  if (value.length < 32)
    throw new AppError(503, "Session signing is not configured.");
  return value;
}
export function equal(a: string, b: string) {
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
}
export function sign(data: Record<string, unknown>) {
  const body = Buffer.from(JSON.stringify(data)).toString("base64url");
  return (
    body + "." + createHmac("sha256", secret()).update(body).digest("base64url")
  );
}
export function verify(token: string): Record<string, unknown> {
  const pieces = token.split(".");
  if (pieces.length !== 2) throw new AppError(401, "Invalid session.");
  const [body, sig] = pieces;
  const expected = createHmac("sha256", secret())
    .update(body)
    .digest("base64url");
  if (!equal(sig, expected)) throw new AppError(401, "Invalid session.");
  let data;
  try {
    data = JSON.parse(Buffer.from(body, "base64url").toString());
  } catch {
    throw new AppError(401, "Invalid session.");
  }
  if (!data || typeof data.exp !== "number" || data.exp <= Date.now())
    throw new AppError(401, "Session expired.");
  return data;
}
export type Identity = { sub: string; role: "operator" | "judge" };
export function session(request: Request): Identity {
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("work_session="))
    ?.slice(13);
  if (!token)
    throw new AppError(401, "Enter your workspace access code to continue.");
  const data = verify(token);
  if (
    data.kind !== "session" ||
    typeof data.sub !== "string" ||
    !["operator", "judge"].includes(String(data.role))
  )
    throw new AppError(401, "Invalid session.");
  return { sub: data.sub, role: data.role as Identity["role"] };
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.APP_ORIGIN || new URL(request.url).origin;
  if (!origin || origin !== expected)
    throw new AppError(403, "Request origin is not permitted.");
}
export async function body<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new AppError(415, "Send JSON.");
  const reader = request.body?.getReader();
  if (!reader) throw new AppError(400, "A request body is required.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const r = await reader.read();
    if (r.done) break;
    size += r.value.length;
    if (size > 32768) {
      await reader.cancel();
      throw new AppError(413, "Request exceeds 32 KB.");
    }
    chunks.push(r.value);
  }
  let data;
  try {
    data = JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    throw new AppError(400, "Invalid JSON.");
  }
  const result = schema.safeParse(data);
  if (!result.success)
    throw new AppError(
      400,
      result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")
        .slice(0, 500),
    );
  return result.data;
}
export function json(value: unknown, status = 200) {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export async function handle(fn: () => Promise<Response>) {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AppError) return json({ error: e.message }, e.status);
    console.error(
      "Request failed",
      e instanceof Error ? e.name : "UnknownError",
    );
    return json(
      {
        error:
          "The operation could not be completed. Check server configuration and retry.",
      },
      500,
    );
  }
}
export function login(code: string) {
  let role: Identity["role"];
  if (
    process.env.OPERATOR_ACCESS_CODE &&
    equal(code, process.env.OPERATOR_ACCESS_CODE)
  )
    role = "operator";
  else if (
    process.env.JUDGE_ACCESS_CODE &&
    equal(code, process.env.JUDGE_ACCESS_CODE)
  )
    role = "judge";
  else throw new AppError(401, "Access code was not accepted.");
  return sign({
    kind: "session",
    sub: role === "operator" ? "operator" : randomUUID(),
    role,
    exp: Date.now() + 8 * 60 * 60 * 1000,
  });
}
export function operator(request: Request) {
  const who = session(request);
  if (who.role !== "operator")
    throw new AppError(403, "Operator access is required.");
  return who;
}
