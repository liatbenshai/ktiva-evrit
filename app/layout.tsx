import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import PWAInstaller from "@/components/PWAInstaller";

const heebo = Heebo({ 
  subsets: ["hebrew"],
  weight: ['300', '400', '500', '700'],
});

export const metadata: Metadata = {
  title: "כתיבה בעברית - פלטפורמה לשיפור כתיבה וניסוח",
  description: "פלטפורמה חכמה לכתיבת מאמרים, מיילים, פוסטים, סיפורים, סיכומים ופרוטוקולים בעברית תקנית",
  manifest: "/manifest.json",
  themeColor: "#6366f1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "כתיבה עברית",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
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
        <PWAInstaller />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                      console.log('SW registered: ', registration);
                    })
                    .catch((registrationError) => {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}