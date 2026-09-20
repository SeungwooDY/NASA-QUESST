import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sonic Boom Simulator",
  description: "Design supersonic aircraft and compete for the quietest sonic boom!",
};

const JSON_LD = `{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "NASA QUESST",
  "telephone": "1234567890",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main St",
    "addressLocality": "Fairfax",
    "addressRegion": "Virginia",
    "postalCode": "22033"
  },
  "areaServed": [
    "Aerodynamics"
  ],
  "makesOffer": [
    {
      "@type": "Offer",
      "itemOffered": {
        "@type": "Service",
        "name": "Fun project for elementary schoolers."
      }
    }
  ]
}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-white min-h-screen`}
      >
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON_LD }} />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
