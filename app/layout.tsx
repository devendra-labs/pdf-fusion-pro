import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
    default: "PDF Fusion Pro",
    template: "%s | PDF Fusion Pro",
  },

  description:
    "PDF Fusion Pro is a modern all-in-one PDF toolkit for merging, compressing, splitting, converting, rotating, protecting, unlocking, and managing PDF files.",

  keywords: [
    "PDF tools",
    "PDF editor",
    "merge PDF",
    "compress PDF",
    "split PDF",
    "PDF to image",
    "PDF to Word",
    "image to PDF",
    "rotate PDF",
    "protect PDF",
    "unlock PDF",
    "PDF page manager",
  ],

  applicationName: "PDF Fusion Pro",

  authors: [
    {
      name: "PDF Fusion Pro",
    },
  ],

  creator: "PDF Fusion Pro",
  publisher: "PDF Fusion Pro",

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title: "PDF Fusion Pro",
    description:
      "A modern all-in-one PDF toolkit for everyday document workflows.",
    type: "website",
    siteName: "PDF Fusion Pro",
  },

  twitter: {
    card: "summary",
    title: "PDF Fusion Pro",
    description:
      "A modern all-in-one PDF toolkit for merging, compressing, converting, and managing PDFs.",
  },

  metadataBase: new URL("http://localhost:3000"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}