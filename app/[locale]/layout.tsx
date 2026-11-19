
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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://revenue.adamacity.gov.et"
  ),

  title: {
    default: "Adama Municipal Revenue Management System",
    template: "%s | Adama Municipal Revenue",
  },

  applicationName: "Adama Municipal Revenue Management System",

  description:
    "An integrated digital platform for Adama City Administration to manage municipal revenue, taxpayer registration, tax assessment, tariffs, billing, collections, payments, cash reconciliation, and financial reporting.",

  keywords: [
    "Adama City",
    "Adama Municipality",
    "Municipal Revenue Management",
    "Revenue Administration",
    "Taxpayer Management",
    "Tax Assessment",
    "Tariff Management",
    "Revenue Collection",
    "Payment Management",
    "Cash Reconciliation",
    "Financial Reporting",
    "Municipal Tax",
    "Digital Government",
    "Ethiopia",
  ],

  authors: [
    {
      name: "Adama City Administration",
    },
  ],

  creator: "Adama City Administration",
  publisher: "Adama City Administration",


  category: "Government",

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },

  robots: {
    index: false,
    follow: false,
    nocache: true,
  },

  openGraph: {
    type: "website",
    locale: "en_ET",
    siteName: "Adama Municipal Revenue Management System",
    title: "Adama Municipal Revenue Management System",
    description:
      "Integrated municipal revenue administration for taxpayer services, assessments, billing, collections, payments, and financial management.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

const locales = ["en", "am", "or"] as const;

export default async function RootLayout({
  children,
  params,
}: Props) {
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
