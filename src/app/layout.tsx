import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ToastContextProvider } from "@/lib/useToast";
import { HeaderWithAuth } from '@/components/layout/HeaderWithAuth';
import React from 'react';

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "ChaatMe.com",
  description: "ChaatMe.com – fast, modern chat and calling.",
  authors: [{ name: "ChaatMe" }],
  keywords: "chat,messaging,calling,video,ChaatMe",
  creator: "ChaatMe",
  publisher: "ChaatMe",
  robots: "index, follow",
  openGraph: {
    title: "ChaatMe.com",
    description: "ChaatMe.com – fast, modern chat and calling.",
    url: "https://chaatme.com",
    siteName: "ChaatMe",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@chaatme",
    title: "ChaatMe.com",
    description: "ChaatMe.com – fast, modern chat and calling.",
  },
  icons: {
    icon: "/ChaatMeLogo.jpg",
    shortcut: "/ChaatMeLogo.jpg",
    apple: "/ChaatMeLogo.jpg"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <ToastContextProvider>
            <HeaderWithAuth />
            {children}
          </ToastContextProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
