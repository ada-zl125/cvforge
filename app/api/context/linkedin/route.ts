import { NextResponse } from "next/server";
import { isLinkedInProfileUrl, truncateContextText } from "@/lib/agent/context-sources";

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const url = typeof body.url === "string" ? body.url.trim() : "";

  if (!isLinkedInProfileUrl(url)) {
    return NextResponse.json(
      { error: "Only LinkedIn personal profile URLs are supported." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 CVForge Context Fetcher",
        Accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "LinkedIn profile could not be fetched. Please upload exported profile text instead." },
        { status: 502 }
      );
    }

    const html = await response.text();
    const text = truncateContextText(htmlToText(html));
    if (text.length < 80) {
      return NextResponse.json(
        { error: "LinkedIn profile did not expose enough public text. Please upload exported profile text instead." },
        { status: 422 }
      );
    }

    return NextResponse.json({ text });
  } catch {
    return NextResponse.json(
      { error: "LinkedIn profile could not be fetched. Please upload exported profile text instead." },
      { status: 502 }
    );
  }
}
