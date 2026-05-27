import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const dammitSans = localFont({
  src: "../fonts/dammitsansv0.2-bold.otf",
  variable: "--font-dammit-sans",
  weight: "700",
});

export const metadata: Metadata = {
  title: "Scrapscn — Sentry Design System for shadcn",
  description:
    "A shadcn-compatible component registry based on the Sentry design system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${rubik.variable} ${dammitSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
