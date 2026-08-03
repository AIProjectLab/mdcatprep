import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MDCAT Prep - Full Length Mock Tests",
  description: "Practice 180 MCQ full-length MDCAT tests with real past paper questions. Timed 3-hour exams with instant scoring.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${jakarta.variable} ${inter.variable}`}>
        <body className="min-h-screen bg-[#faf6ef] text-stone-800 antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
