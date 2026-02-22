import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono, Dela_Gothic_One } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const delaGothic = Dela_Gothic_One({
  variable: "--font-dela-gothic",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "75 Jours Challenge",
  description: "Challenge 75 jours — Simon & Emma",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "75 Jours",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FF6B35",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{if(localStorage.getItem('75j-theme')==='light')document.documentElement.classList.add('light')}catch(e){}})()` }} />
      </head>
      <body
        className={`${dmSans.variable} ${jetbrainsMono.variable} ${delaGothic.variable} antialiased`}
      >
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
