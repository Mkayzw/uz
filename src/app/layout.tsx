import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata: Metadata = {
  title: "UniStay - Student Housing",
  description: "The premier platform for students to find safe, affordable, and convenient off-campus housing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
