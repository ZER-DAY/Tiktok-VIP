import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LiveStream Tech",
  description: "Analyze TikTok accounts with AI-powered insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
