import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Onaylı mockup'taki yazı tipleri; Türkçe karakterler için latin-ext.
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });
const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "Alaris · Koç paneli",
  description: "Alaris koçluk platformu, koç paneli",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${inter.variable} ${grotesk.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
