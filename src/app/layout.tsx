import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { brand, getBrand } from "@/lib/brand";
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
  title: `${brand.name} ${brand.nameTh} — ${brand.tagline}`,
  description: `ระบบบริหารจัดการร้านซ่อม — ${brand.name}`,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const b = await getBrand();
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{
        "--brand-dark": b.colors.dark,
        "--brand-teal": b.colors.teal,
        "--brand-mint": b.colors.mint,
        "--brand-accent": b.colors.accent,
        "--brand-bg": b.colors.bg,
      } as React.CSSProperties}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
