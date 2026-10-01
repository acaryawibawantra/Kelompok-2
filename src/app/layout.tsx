import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { Caveat, Inter, Lora, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-handwritten",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-modern",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TaskCanvas",
    template: "%s · TaskCanvas",
  },
  description:
    "TaskCanvas — kelola project, subject, dan task dalam satu canvas visual. Streak harian, target, dan kolaborasi.",
  applicationName: "TaskCanvas",
  appleWebApp: {
    capable: true,
    title: "TaskCanvas",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f7" },
    { media: "(prefers-color-scheme: dark)", color: "#131217" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${inter.variable} ${caveat.variable} ${jakarta.variable} ${lora.variable} h-full`}
    >
      <head>
        <Script src="/theme-init.js" strategy="beforeInteractive" />
      </head>
      <body className="min-h-dvh bg-canvas text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
