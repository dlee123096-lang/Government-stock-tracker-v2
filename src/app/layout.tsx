import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SignalAlpha — Public Market Disclosure Tracker",
    template: "%s | SignalAlpha",
  },
  description:
    "Track and score insider trades, congressional STOCK Act disclosures, and SEC Form 4 filings with a transparent scoring system. Real-time data from SEC EDGAR.",
  keywords: [
    "insider trading tracker",
    "STOCK Act disclosures",
    "congressional stock trades",
    "SEC Form 4 filings",
    "insider buying signals",
    "government official trades",
    "market disclosure scoring",
    "SEC EDGAR data",
  ],
  openGraph: {
    title: "SignalAlpha — Public Market Disclosure Tracker",
    description:
      "Track insider trades and congressional stock disclosures. Transparent scoring system powered by SEC EDGAR and STOCK Act data.",
    type: "website",
    siteName: "SignalAlpha",
  },
  twitter: {
    card: "summary",
    title: "SignalAlpha — Public Market Disclosure Tracker",
    description:
      "Track insider trades and congressional stock disclosures with a transparent scoring system.",
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
