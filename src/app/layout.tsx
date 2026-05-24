import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Signal Alpha | Congress Stock Trade Tracker & STOCK Act Disclosure Dashboard",
    template: "%s | Signal Alpha Stock",
  },
  description:
    "Track public congressional stock trade disclosures, STOCK Act filings, and reported trades with a clean educational dashboard from Signal Alpha.",
  keywords: [
    "congressional stock trades",
    "STOCK Act disclosures",
    "congressional financial disclosures",
    "politician stock trading tracker",
    "SEC Form 4 filings",
    "insider trade disclosures",
    "public trading disclosures",
    "SEC EDGAR data",
  ],
  openGraph: {
    title: "Signal Alpha | Congress Stock Trade Tracker & STOCK Act Disclosure Dashboard",
    description:
      "Track public congressional stock trade disclosures, STOCK Act filings, and reported trades with a clean educational dashboard from Signal Alpha.",
    type: "website",
    siteName: "Signal Alpha Stock",
  },
  twitter: {
    card: "summary",
    title: "Signal Alpha | Congress Stock Trade Tracker",
    description:
      "Track congressional stock trade disclosures and STOCK Act filings with a transparent scoring dashboard.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-stone-50 text-slate-800 min-h-screen flex flex-col antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
