import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AIくらべ - AI比較プラットフォーム",
  description: "複数のAIモデルを同時に比較できるプラットフォーム",
  icons: {
    icon: [
      { url: "/image/aikurabe_fav.png", sizes: "32x32", type: "image/png" },
      { url: "/image/aikurabe_fav.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/image/aikurabe_fav.png",
    apple: "/image/aikurabe_fav.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
