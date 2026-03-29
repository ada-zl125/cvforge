import { NextResponse } from "next/server";
import type { ResumeContent, ResumeLanguage } from "@/lib/types/resume";
import { renderResumeHTML } from "@/lib/pdf/resume-html";

async function launchBrowser() {
  const puppeteer = (await import("puppeteer-core")).default;

  // On Vercel: use @sparticuz/chromium (serverless-compatible)
  // Locally: use system Chrome installation
  if (process.env.VERCEL) {
    const chromium = (await import("@sparticuz/chromium")).default;
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 794, height: 1123 },
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  // Local dev — try common Chrome paths
  const paths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", // macOS
    "/usr/bin/google-chrome",        // Linux
    "/usr/bin/chromium-browser",     // Linux
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // Windows
  ];

  const { existsSync } = await import("fs");
  const executablePath = paths.find((p) => existsSync(p));
  if (!executablePath) {
    throw new Error("Chrome not found. Install Google Chrome for local PDF export.");
  }

  return puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 794, height: 1123 },
    executablePath,
    headless: true,
  });
}

export async function POST(request: Request) {
  try {
    const { content, title, language = "en" } = (await request.json()) as {
      content: ResumeContent;
      title: string;
      language?: ResumeLanguage;
    };

    const html = renderResumeHTML(content, language);
    const browser = await launchBrowser();

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    await browser.close();

    const filename = `${title || "resume"}.pdf`;

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    console.error("PDF export failed:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  }
}
