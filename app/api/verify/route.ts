import { z } from "zod";
import { handle, body, sameOrigin, session, json } from "@/lib/security";
import { rateLimit, saveReport } from "@/lib/db";
import { verifyOnChain } from "@/lib/chain";
export const maxDuration = 60;
export async function POST(request: Request) {
  return handle(async () => {
    sameOrigin(request);
    const who = session(request);
    await rateLimit("verify:" + who.sub, 10);
    const input = await body(
      request,
      z.object({
        transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
        receiptId: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
      }),
    );
    const report = await verifyOnChain(input.transactionHash, input.receiptId);
    const stored = await saveReport(who.sub, "chain-receipt", report);
    return json({ ...report, id: stored.id, persisted: true });
  });
}
