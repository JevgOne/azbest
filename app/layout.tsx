import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "QSPORT Marketing",
  description: "Marketingov\u00FD n\u00E1stroj pro qsport.cz",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
