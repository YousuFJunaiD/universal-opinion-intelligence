import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Universal Opinion Intelligence Platform",
  description: "Chat-first opinion intelligence workspace for text datasets."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
