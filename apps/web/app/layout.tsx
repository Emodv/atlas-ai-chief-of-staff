import "./globals.css";
import "./auth.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Atlas.Moda — AI Chief of Staff",
  description: "Atlas.Moda connects your workspace, learns your context, and helps you focus on what matters while keeping sensitive actions gated.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
