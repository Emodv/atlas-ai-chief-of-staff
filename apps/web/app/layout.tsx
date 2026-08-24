import "./globals.css";
import "./auth.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  metadataBase: new URL("https://atlas.moda"),
  title: {
    default: "Atlas.Moda — AI Chief of Staff for Google Workspace",
    template: "%s | Atlas.Moda",
  },
  description: "Atlas.Moda is a privacy-forward AI chief of staff for Gmail, Calendar, Contacts, Drive, Docs, and Sheets that helps surface priorities and protect important follow-ups.",
  alternates: { canonical: "/" },
  applicationName: "Atlas.Moda",
  category: "productivity",
  keywords: ["AI chief of staff", "Google Workspace AI assistant", "Gmail AI assistant", "executive AI assistant", "personal CRM AI", "meeting prep AI", "follow-up AI"],
  openGraph: {
    type: "website",
    siteName: "Atlas.Moda",
    url: "https://atlas.moda",
    title: "Atlas.Moda — AI Chief of Staff for Google Workspace",
    description: "Connect your Google Workspace, surface what matters, and keep sensitive actions gated.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Atlas.Moda — AI Chief of Staff for Google Workspace",
    description: "Connect your Google Workspace, surface what matters, and keep sensitive actions gated.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Atlas.Moda",
    url: "https://atlas.moda",
  };
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Atlas.Moda",
    url: "https://atlas.moda",
    description: "Privacy-forward AI chief of staff for Google Workspace.",
  };

  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        {children}
      </body>
    </html>
  );
}
