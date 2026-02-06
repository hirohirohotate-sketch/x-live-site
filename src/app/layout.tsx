import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthButton from "@/components/AuthButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LiveShelf",
  description: "X Live Archive Shelf",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold hover:text-gray-700 transition-colors">
              LiveShelf
            </Link>
            <div className="flex items-center gap-6">
              <nav className="flex items-center gap-4 hidden sm:flex">
                <Link
                  href="/add"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  アーカイブ追加
                </Link>
                <Link
                  href="/me"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  自分の棚
                </Link>
              </nav>
              <AuthButton />
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
