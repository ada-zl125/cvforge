"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUILanguage } from "@/lib/ui-language";
import { t } from "@/lib/translations";

const STORAGE_KEY = "cookie-consent";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY) !== "accepted";
}

function getServerSnapshot() {
  return false;
}

export function CookieBanner() {
  const { lang } = useUILanguage();
  const tr = t[lang];
  const [dismissed, setDismissed] = useState(false);
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setDismissed(true);
  }

  if (dismissed || !visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background px-6 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {tr.cookieBannerText}{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
            {tr.privacyPolicy}
          </Link>
        </p>
        <Button size="sm" variant="outline" className="btn-hover-border shrink-0 cursor-pointer" onClick={accept}>
          {tr.cookieAccept}
        </Button>
      </div>
    </div>
  );
}
