import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
export const metadata: Metadata = {
  title: "OMO Proof — community funding, traceable",
  description:
    "Noncustodial community funding receipts tied to immutable campaign terms on PortalDot testnet.",
};
export default function RootLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
