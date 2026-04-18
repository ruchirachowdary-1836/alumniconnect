import type { Metadata } from "next";

import { ClerkProvider } from "@clerk/nextjs";

import { SiteHeader } from "@/components/site-header";
import { isClerkConfigured } from "@/lib/auth-config";

import "./globals.css";

export const metadata: Metadata = {
  title: "BVRITH Alumni Mentorship Portal",
  description:
    "Google sign-in enabled alumni mentorship platform for BVRITH students and alumni.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = (
    <html lang="en">
      <body>
        <div className="page-chrome" />
        <SiteHeader />
        <main>{children}</main>
      </body>
    </html>
  );

  return isClerkConfigured ? <ClerkProvider>{content}</ClerkProvider> : content;
}
