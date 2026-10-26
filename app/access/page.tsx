"use client";
import { useState } from "react";
import Link from "next/link";
export default function Access() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="access-wrap">
      <Link href="/" className="wordmark">
        ← Back to workspace
      </Link>
      <div className="panel access-panel">
        <span className="eyebrow">WORKSPACE ACCESS</span>
        <h1>Continue your work.</h1>
        <p>
          Your operator or judging code unlocks connected services. Sample cases
          are available without signing in.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setMessage("");
            try {
              const r = await fetch("/api/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
              });
              const d = await r.json();
              if (!r.ok) throw Error(d.error);
              location.assign("/");
            } catch (e) {
              setMessage(e instanceof Error ? e.message : "Sign-in failed.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Access code
            <input
              type="password"
              autoComplete="current-password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              minLength={12}
              required
            />
          </label>
          <button disabled={busy}>
            {busy ? "Opening…" : "Open workspace"}
          </button>
        </form>
        <p role="status">{message}</p>
      </div>
    </main>
  );
}
