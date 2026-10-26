"use client";
import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
export function Workspace({
  name,
  tag,
  children,
}: {
  name: string;
  tag: string;
  children: ReactNode;
}) {
  const [status, setStatus] = useState("Checking services");
  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) =>
        setStatus(
          d.missing.length ? "Sample workspace" : "Services configured",
        ),
      )
      .catch(() => setStatus("Connection unavailable"));
  }, []);
  return (
    <>
      <header className="topbar">
        <Link className="wordmark" href="/">
          <span className="brand-icon">◈</span>
          {name}
        </Link>
        <nav>
          <Link href="/">Workspace</Link>
          <Link href="/access">Access</Link>
        </nav>
        <span className="pill">
          <i />
          {status}
        </span>
      </header>
      <main className="main">
        <div className="breadcrumb">
          DUKERS LAB <span>/</span> {tag}
        </div>
        {children}
      </main>
      <footer>
        Built by DUKERS · Evidence before action.
        <a href="/api/health">Service readiness ↗</a>
      </footer>
    </>
  );
}
export function Download({
  data,
  name = "report.json",
}: {
  data: unknown;
  name?: string;
}) {
  return (
    <button
      className="secondary"
      onClick={() => {
        const url = URL.createObjectURL(
          new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
          }),
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
      }}
    >
      Download evidence ↓
    </button>
  );
}
export async function post(path: string, payload: unknown) {
  const r = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const d = await r.json();
  if (!r.ok) throw Error(d.error || "Request failed.");
  return d;
}
