import { z } from "zod";
import { createHash } from "node:crypto";
import { handle, sameOrigin, body, json, login } from "@/lib/security";
import { rateLimit } from "@/lib/db";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return handle(async () => {
    sameOrigin(request);
    const ip = request.headers.get("x-vercel-forwarded-for") || "local";
    await rateLimit(
      "login:" + createHash("sha256").update(ip).digest("hex"),
      10,
    );
    const input = await body(
      request,
      z.object({ code: z.string().min(12).max(200) }),
    );
    const token = login(input.code);
    const response = json({ ok: true });
    response.headers.set(
      "Set-Cookie",
      `work_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
    );
    return response;
  });
}
export async function DELETE(request: Request) {
  return handle(async () => {
    sameOrigin(request);
    const response = json({ ok: true });
    response.headers.set(
      "Set-Cookie",
      "work_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0",
    );
    return response;
  });
}
