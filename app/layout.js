import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Teckningsanmälan – Auxesis Pharma Holding AB (publ)",
  description:
    "Digital teckningsanmälan för Auxesis Pharma Holding AB (publ). Teckningsperiod 15 aug – 14 nov 2025.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="sv">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
