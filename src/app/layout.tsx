import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";

import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

const figmaCaptureBootstrap = `
  const parameters = new URLSearchParams(window.location.hash.slice(1));
  const captureSource = "https://mcp.figma.com/mcp/html-to-design/capture.js";
  if (parameters.has("figmacapture") && !document.querySelector(\`script[src="\${captureSource}"]\`)) {
    const script = document.createElement("script");
    script.src = captureSource;
    script.async = true;
    document.head.appendChild(script);
  }
`;

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
  description: "A local playground for building with Sentry's regular Scraps components.",
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
        {process.env.NODE_ENV === "development" ? (
          <Script id="figma-capture-bootstrap">{figmaCaptureBootstrap}</Script>
        ) : null}
      </body>
    </html>
  );
}
