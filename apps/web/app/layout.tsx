import "./globals.css";
import "./auth.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Atlas — ChatGPT-native AI Chief of Staff",
  description: "A digital twin, relationship graph, and trust layer that makes ChatGPT deeply personal.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
