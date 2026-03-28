import { NextResponse } from "next/server";
import type { ResumeContent } from "@/lib/types/resume";
import { renderResumeHTML } from "@/lib/pdf/resume-html";

async function launchBrowser() {
  const puppeteer = (await import("puppeteer-core")).default;

  if (process.env.VERCEL) {
    const chromium = (await import("@sparticuz/chromium")).default;
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: null,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  const paths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  ];

  const { existsSync } = await import("fs");
  const executablePath = paths.find((p) => existsSync(p));
  if (!executablePath) {
    throw new Error("Chrome not found. Install Google Chrome for local PNG export.");
  }

  return puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: null,
    executablePath,
    headless: true,
  });
}

export async function POST(request: Request) {
  try {
    const { content, title } = (await request.json()) as {
      content: ResumeContent;
      title: string;
    };

    const html = renderResumeHTML(content);
    const browser = await launchBrowser();

    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 3 });
    await page.setContent(html, { waitUntil: "networkidle0" });

    const screenshot = await page.screenshot({ type: "png", fullPage: true });

    await browser.close();

    const filename = `${title || "resume"}.png`;

    return new NextResponse(Buffer.from(screenshot), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    console.error("PNG export failed:", error);
    return NextResponse.json(
      { error: "Failed to generate PNG" },
      { status: 500 },
    );
  }
}
