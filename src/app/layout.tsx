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
        <ThemeProvider>
          {children}
          {/* Global Beta badge */}
          <div className="fixed top-3 right-3 z-50 select-none pointer-events-none" role="note" aria-label="This site is in beta">
            <span
              className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wide rounded-full shadow-md bg-blue-600 text-white dark:bg-blue-500"
              title="Beta"
            >
              Beta
            </span>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
