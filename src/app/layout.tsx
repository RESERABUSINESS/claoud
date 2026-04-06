/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from "next";
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "عروض ذكية | Smart Offers",
  description: "نظام أتمتة عروض وخصومات ذكية للمتاجر الإلكترونية السعودية",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-[#0B1120] text-gray-100" style={{ fontFamily: "'Tajawal', sans-serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
