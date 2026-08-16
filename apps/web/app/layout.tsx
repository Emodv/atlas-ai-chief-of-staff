import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Atlas — AI Chief of Staff",
  description: "A digital twin that learns how you work and handles the noise.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
