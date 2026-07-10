import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "H75",
  description: "H75 — challenge d'habitudes de Simon & Emma",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "H75",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0B0A10",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/h75-touch.png" />
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{if(localStorage.getItem('75j-theme')==='light')document.documentElement.classList.add('light')}catch(e){}})()` }} />
      </head>
      <body
        className={`${dmSans.variable} ${jetbrainsMono.variable} ${playfair.variable} antialiased`}
      >
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then(reg => {
                    try {
                      const stored = localStorage.getItem('75j-notif');
                      if (stored) {
                        const data = JSON.parse(stored);
                        if (data.enabled && reg.active) {
                          reg.active.postMessage({ type: 'SCHEDULE_REMINDER', ...data });
                        }
                      }
                    } catch(e) {}
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
