import { JsonLd } from "local-business-jsonld/next";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BUSINESS, buildJsonLd, SITE_URL } from "@/lib/business";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${BUSINESS.name} — Plombier au Mans`,
  description: BUSINESS.description,
};

const jsonLd = buildJsonLd();

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          lineHeight: 1.6,
          margin: "0 auto",
          maxWidth: "44rem",
          padding: "2rem 1.25rem 4rem",
        }}
      >
        <JsonLd data={jsonLd} id="ld-plomberie-dupont" />
        {children}
      </body>
    </html>
  );
}
