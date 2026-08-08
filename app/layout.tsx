import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ClickSpark from "@/components/ClickSpark";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UILanguageProvider } from "@/lib/ui-language";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "CVForge | Resume, CV, and Cover Letter Builder",
  description: "Create resumes, academic CVs, and cover letters with structured editing, live preview, export tools, and Agent Mode.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");
  const chineseFontUrl = `${basePath}/fonts/noto-serif-cjk-sc-regular.otf`;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <style>{`
          @font-face {
            font-family: "Noto Serif CJK SC";
            src: url("${chineseFontUrl}") format("opentype");
            font-weight: 400;
            font-style: normal;
            font-display: swap;
          }
        `}</style>
      </head>
      <body className="min-h-full flex flex-col">
          <UILanguageProvider>
            <TooltipProvider>
              <ClickSpark
                sparkColor="#111111"
                sparkSize={8}
                sparkRadius={18}
                sparkCount={8}
                duration={360}
                easing="ease-out"
                extraScale={1.1}
              >
                {children}
              </ClickSpark>
            </TooltipProvider>
          </UILanguageProvider>
        </body>
    </html>
  );
}
