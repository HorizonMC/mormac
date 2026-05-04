import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { brand } from "@/lib/brand";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{
        "--brand-dark": brand.colors.dark,
        "--brand-teal": brand.colors.teal,
        "--brand-mint": brand.colors.mint,
        "--brand-accent": brand.colors.accent,
        "--brand-bg": brand.colors.bg,
      } as React.CSSProperties}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
