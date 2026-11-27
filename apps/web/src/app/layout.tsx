import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Suspense, type ReactNode } from "react";
import { I18nProvider } from "@/components/i18n";
import { getLocale } from "@/lib/i18n";
import "./globals.css";

// Onaylı mockup'taki yazı tipleri; Türkçe karakterler için latin-ext.
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });
const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "Alaris",
  description: "Alaris coaching platform",
};

/** Dil isteğe göre (çerez / tarayıcı) belirlenir; bu yüzden Suspense içinde. */
async function WithLocale({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return <I18nProvider locale={locale}>{children}</I18nProvider>;
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${inter.variable} ${grotesk.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Suspense>
          <WithLocale>{children}</WithLocale>
        </Suspense>
      </body>
    </html>
  );
}
