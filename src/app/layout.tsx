import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GuardianTutor — AI Homework & Learning Companion",
  description: "Your child's personal AI tutor. Homework help, doubt solving, and progress tracking for parents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full bg-gray-50`}>
        <div className="max-w-107.5 mx-auto min-h-screen relative bg-white shadow-xl">
          {children}
        </div>
      </body>
    </html>
  );
}
