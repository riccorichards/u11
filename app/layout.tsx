import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dinamo Batumi U15 | Squad Hub",
  description: "Official stats platform for Dinamo Batumi U15",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-pitch text-white antialiased">{children}</body>
    </html>
  );
}
