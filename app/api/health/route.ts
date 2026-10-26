import { json } from "@/lib/security";
import config from "@/project.json";
export async function GET() {
  const missing = config.requiredEnv.filter((name) => !process.env[name]);
  return json({
    application: config.name,
    status: missing.length
      ? "configuration_required"
      : "configured_not_live_verified",
    missing,
    mode: missing.length ? "configuration_required" : "connected",
    version: "0.1.0",
  });
}
