import type { Metadata } from "next";
import { SHOWCASE_TITLE } from "@/lib/services/showcase-config";
import "./globals.css";

export const metadata: Metadata = {
  title: SHOWCASE_TITLE,
  description: "Opinion analysis, review-quality flags, evidence and reports for human review."
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
