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
  title:
    "Convert-it | Free Online File Converter for PDF, Images, Documents & More",
  description:
    "Convert files online in seconds. Convert PDFs, images, Word documents, Excel, PowerPoint, videos, audio, and more with fast, secure, and free file conversion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-[#0b0d11] text-slate-100 min-h-screen antialiased selection:bg-red-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
