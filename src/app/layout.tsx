import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "MDCAT Pro - Full Length Mock Tests",
  description: "Practice 180 MCQ full-length MDCAT tests with real past paper questions. Timed 3-hour exams with instant scoring.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
