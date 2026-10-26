import { describe, it, expect, beforeEach } from "vitest";
import { z } from "zod";
import {
  sign,
  verify,
  session,
  sameOrigin,
  body,
  login,
} from "../lib/security";
beforeEach(() => {
  process.env.SESSION_SECRET = "test-only-32-byte-secret-never-deploy";
  process.env.OPERATOR_ACCESS_CODE = "test-operator-code";
  delete process.env.APP_ORIGIN;
});
describe("workspace security", () => {
  it("rejects expired and altered identities", () => {
    const token = sign({
      exp: Date.now() + 10000,
      kind: "session",
      sub: "a",
      role: "judge",
    });
    expect(verify(token).sub).toBe("a");
    expect(() => verify(token + "x")).toThrow();
    expect(() => verify(sign({ exp: Date.now() - 1 }))).toThrow();
  });
  it("requires a signed cookie and accepted access code", () => {
    expect(() => session(new Request("https://app.test"))).toThrow();
    const token = login("test-operator-code");
    expect(
      session(
        new Request("https://app.test", {
          headers: { cookie: "work_session=" + token },
        }),
      ).role,
    ).toBe("operator");
    expect(() => login("incorrect-code")).toThrow();
  });
  it("rejects cross-site mutation and oversized input", async () => {
    expect(() =>
      sameOrigin(
        new Request("https://app.test", {
          headers: { origin: "https://other.test" },
        }),
      ),
    ).toThrow();
    expect(() =>
      sameOrigin(
        new Request("https://app.test", {
          headers: { origin: "https://app.test" },
        }),
      ),
    ).not.toThrow();
    await expect(
      body(
        new Request("https://app.test", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify("x".repeat(40000)),
        }),
        z.string(),
      ),
    ).rejects.toThrow("32 KB");
  });
});
