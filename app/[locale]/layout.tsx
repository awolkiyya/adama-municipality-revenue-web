// app/[locale]/layout.tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

import { AppProvider } from "@/providers";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



export const metadata: Metadata = {
  title: {
    default: "CSPR | Adama City Smart Planning & Reporting",
    template: "%s | CSPR Adama City",
  },
  description:
    "A centralized digital governance platform for structured planning, monitoring, and reporting across all administrative levels of Adama City.",
  keywords: [
    "Adama City",
    "Governance",
    "Smart Planning",
    "Reporting System",
    "Digital Administration",
    "CSPR",
  ],
  authors: [{ name: "Adama City Administration" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

const locales = ["en", "am", "or"] as const;

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  const messages = (await import(`../../i18n/${locale}.json`)).default;

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {/* ✅ ThemeProvider here — Server Component context, script injection is safe */}
        <ThemeProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <AppProvider>{children}</AppProvider>
          </NextIntlClientProvider>

          <Toaster
            richColors
            position="top-right"
            closeButton
            expand={false}
            toastOptions={{
              style: {
                fontSize: "14px",
                borderRadius: "10px",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}