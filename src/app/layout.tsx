import type { Metadata } from "next";
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
      <body className="antialiased bg-gray-50 text-gray-900 font-sans">
        {children}
      </body>
    </html>
  );
}
