import type { Metadata } from "next";
import { Syne, JetBrains_Mono, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["300", "400", "500", "600", "700"],
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  variable: "--font-bebas",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "GreenLedger — Carbon-Aware AI Dashboard",
  description: "Environmental accountability for AI inference",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${jetbrainsMono.variable} ${bebasNeue.variable}`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
