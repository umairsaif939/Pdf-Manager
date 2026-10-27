import type { Metadata } from "next";
import { DM_Serif_Display, Inter, Caveat } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AppShell } from "@/components/app-shell/AppShell";

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-hand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PDF Flux — Read, Mark Up & Study PDFs Privately",
  description:
    "A beautiful, local-first offline study workspace for reading, annotating, and organizing PDFs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSerif.variable} ${inter.variable} ${caveat.variable}`}
    >
      <body
        suppressHydrationWarning
        className="bg-paper text-ink font-sans antialiased min-h-screen"
      >
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
