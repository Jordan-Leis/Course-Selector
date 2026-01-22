import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coursify - UW Engineering Course Planner",
  description: "Plan your University of Waterloo Engineering courses term by term",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
