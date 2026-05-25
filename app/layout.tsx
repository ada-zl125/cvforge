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
  title: "CVForge — Professional Resumes, Effortlessly",
  description: "Create professional resumes in minutes. Focus on your content — CVForge handles the layout.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
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
