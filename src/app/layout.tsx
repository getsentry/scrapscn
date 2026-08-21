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
  title: "Scrapscn Playground",
  description:
    "A local playground for building with Sentry's regular Scraps components.",
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
      <body className="flex min-h-full flex-col">
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
