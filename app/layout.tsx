import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({ 
  subsets: ["hebrew"],
  weight: ['300', '400', '500', '700'],
});

export const metadata: Metadata = {
  title: "כתיבה בעברית - פלטפורמה לשיפור כתיבה וניסוח",
  description: "פלטפורמה חכמה לכתיבת מאמרים, מיילים, פוסטים, סיפורים, סיכומים ופרוטוקולים בעברית תקנית",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={heebo.className}>
        {children}
      </body>
    </html>
  );
}