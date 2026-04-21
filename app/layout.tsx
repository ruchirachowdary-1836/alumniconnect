import type { Metadata } from "next";

import { ClerkProvider } from "@clerk/nextjs";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isClerkConfigured } from "@/lib/auth-config";

import "./globals.css";

export const metadata: Metadata = {
  title: "Alumni Connect",
  description:
    "A student-alumni mentorship, referral, and placement support portal for BVRIT Hyderabad.",
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
        <SiteFooter />
      </body>
    </html>
  );

  return isClerkConfigured ? <ClerkProvider>{content}</ClerkProvider> : content;
}
