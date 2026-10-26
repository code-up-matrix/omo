import { handle, json } from "@/lib/security";
import { config } from "@/lib/chain";
export async function GET() {
  return handle(async () => json(config()));
}
