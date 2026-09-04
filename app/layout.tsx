import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";

import { sectionTitle } from "@/lib/config";

import "./globals.css";

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: sectionTitle(),
  description: "Share your project pitch and pick who you would like to work with.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ebebeb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jetBrainsMono.variable}>
      <body className="dot-field min-h-dvh antialiased">{children}</body>
    </html>
  );
}
