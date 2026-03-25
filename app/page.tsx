"use client";

import { useEffect, useRef, useState } from "react";
import { PenLine, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AuthModal } from "@/components/auth/AuthModal";

const features = [
  {
    icon: PenLine,
    title: "Simple Form Input",
    description:
      "Just type your experience, education, and skills. No formatting headaches — our smart form guides you through every section.",
  },
  {
    icon: Eye,
    title: "Real-time A4 Preview",
    description:
      "See your resume update live as you type. What you see is exactly what you get — pixel-perfect A4 layout, every time.",
  },
  {
    icon: Download,
    title: "Export PDF & Word",
    description:
      "One click to download your resume as a polished PDF or editable Word document. Ready to send to any employer.",
  },
];

function syncCanvasSize(canvas: HTMLCanvasElement): { w: number; h: number } {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  if (w === 0 || h === 0) return { w: 0, h: 0 };
  const bw = Math.round(w * dpr);
  const bh = Math.round(h * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  return { w, h };
}

function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let raf: number;
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) { raf = requestAnimationFrame(draw); return; }
      const { w, h } = syncCanvasSize(canvas);
      if (w === 0 || h === 0) { raf = requestAnimationFrame(draw); return; }
      const ctx = canvas.getContext("2d");
      if (!ctx) { raf = requestAnimationFrame(draw); return; }

      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const time = Date.now() * 0.001;

      // Bold radial lines — slowly rotating starburst
      const lineCount = 24;
      for (let i = 0; i < lineCount; i++) {
        const angle = (Math.PI * 2 * i) / lineCount + time * 0.08;
        const len = 150 + Math.sin(time * 0.5 + i * 0.6) * 100;
        const x2 = cx + Math.cos(angle) * len;
        const y2 = cy + Math.sin(angle) * len;
        const alpha = 0.12 + Math.sin(time * 0.4 + i * 0.5) * 0.06;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(0, 113, 227, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Two bold breathing circles
      for (let i = 0; i < 2; i++) {
        const r = 180 + i * 120 + Math.sin(time * 0.4 + i) * 30;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 113, 227, ${0.15 - i * 0.05})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // Diagonal crossing line
      const diag = time * 0.15;
      const dx1 = w * 0.1 + Math.sin(diag) * w * 0.3;
      const dx2 = w * 0.9 - Math.sin(diag) * w * 0.3;
      ctx.beginPath();
      ctx.moveTo(dx1, 0);
      ctx.lineTo(dx2, h);
      ctx.strokeStyle = "rgba(0, 113, 227, 0.08)";
      ctx.lineWidth = 2;
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

function FeaturesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => { scrollRef.current = window.scrollY; };
    window.addEventListener("scroll", handleScroll, { passive: true });

    let raf: number;
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) { raf = requestAnimationFrame(draw); return; }
      const { w, h } = syncCanvasSize(canvas);
      if (w === 0 || h === 0) { raf = requestAnimationFrame(draw); return; }
      const ctx = canvas.getContext("2d");
      if (!ctx) { raf = requestAnimationFrame(draw); return; }

      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const time = Date.now() * 0.001;
      const scroll = scrollRef.current;

      // Bold flowing waves — 5 layers with varying amplitude
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const yBase = h * 0.15 + i * (h * 0.18);
        const scrollShift = Math.sin(scroll * 0.003 + i) * 30;
        for (let x = 0; x <= w; x += 3) {
          const y =
            yBase + scrollShift +
            Math.sin(x * 0.004 + time * 0.6 + i * 1.5) * 40 +
            Math.cos(x * 0.007 + time * 0.35 + i * 0.8) * 25 +
            Math.sin(x * 0.002 + time * 0.2) * 15;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const alpha = 0.14 - i * 0.02;
        ctx.strokeStyle = `rgba(0, 113, 227, ${Math.max(alpha, 0.04)})`;
        ctx.lineWidth = 2 - i * 0.2;
        ctx.stroke();
      }

      // Scattered particles — larger count, varied sizes
      for (let i = 0; i < 35; i++) {
        const baseX = (w / 35) * i + 20;
        const baseY = (h / 5) * (i % 5) + 30;
        const x = baseX + Math.sin(time * 0.5 + i * 1.1) * 18;
        const y = baseY + Math.cos(time * 0.4 + i * 0.6) * 14 + Math.sin(scroll * 0.002 + i) * 10;
        const alpha = 0.18 + Math.sin(time * 0.9 + i * 0.5) * 0.1;
        const size = 2 + Math.sin(time * 0.6 + i * 0.3) * 2;
        ctx.beginPath();
        ctx.arc(x, ((y % h) + h) % h, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 113, 227, ${alpha})`;
        ctx.fill();
      }

      // Connecting lines between nearby particles for network effect
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i < 15; i++) {
        const px = (w / 15) * i + 50 + Math.sin(time * 0.3 + i * 2) * 30;
        const py = h * 0.3 + (i % 3) * (h * 0.2) + Math.cos(time * 0.4 + i) * 20;
        pts.push({ x: px, y: py });
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            const lineAlpha = (1 - dist / 200) * 0.08;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(0, 113, 227, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

export default function Home() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"sign-in" | "sign-up">("sign-in");

  function openAuth(tab: "sign-in" | "sign-up") {
    setAuthTab(tab);
    setAuthOpen(true);
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultTab={authTab} />

      {/* Navbar */}
      <nav className="group/nav flex h-18 items-center justify-between px-20 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-500 hover:bg-primary/[0.03] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <span className="text-xl font-bold tracking-tight">
          Easy<span className="text-primary">CV</span>
        </span>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            className="cursor-pointer rounded-full px-4 transition-colors duration-200 hover:bg-primary/10 hover:text-primary"
            onClick={() => openAuth("sign-in")}
          >
            Sign In
          </Button>
          <Button
            className="cursor-pointer rounded-full px-4 transition-all duration-200 hover:brightness-110"
            onClick={() => openAuth("sign-up")}
          >
            Get Started
          </Button>
        </div>
      </nav>

      <Separator />

      {/* Hero */}
      <section className="relative flex flex-col items-center gap-8 px-20 py-30 overflow-hidden">
        <HeroCanvas />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,113,227,0.06)_0%,transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(0,113,227,0.06)_0%,transparent_50%)]" />
        <div className="group/badge relative flex cursor-default items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 transition-all duration-300 hover:bg-primary/15 hover:shadow-md hover:shadow-primary/10 hover:scale-105">
          <span className="h-2 w-2 rounded-full bg-primary transition-transform duration-300 group-hover/badge:scale-125" />
          <span className="text-sm text-primary/80 transition-colors duration-300 group-hover/badge:text-primary">
            Now in Beta — Free to use
          </span>
        </div>
        <h1 className="relative max-w-3xl text-center text-6xl font-bold leading-tight tracking-tight">
          Your resume,
          <br />
          perfectly crafted.
        </h1>
        <p className="relative max-w-xl text-center text-lg leading-relaxed text-muted-foreground">
          Fill in your content. We handle the professional layout.
          <br />
          Beautiful resumes in minutes, not hours.
        </p>
        <div className="relative flex items-center gap-4">
          <Button
            size="lg"
            className="group/btn h-12 cursor-pointer rounded-full px-6 text-base transition-all duration-200 hover:brightness-110 hover:shadow-lg hover:shadow-primary/25"
            onClick={() => openAuth("sign-up")}
          >
            Start Building <span className="ml-1 inline-block transition-transform duration-200 group-hover/btn:translate-x-1">→</span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-12 cursor-pointer rounded-full px-6 text-base transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
          >
            See Examples
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="relative flex flex-col items-center gap-16 bg-[#f5f5f7] px-20 py-24 overflow-hidden">
        <FeaturesBackground />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,113,227,0.05)_0%,transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(0,113,227,0.05)_0%,transparent_50%)]" />
        <div className="relative flex flex-col items-center gap-4">
          <h2 className="max-w-lg text-center text-4xl font-bold leading-snug tracking-tight">
            Everything you need.
            <br />
            Nothing you don&apos;t.
          </h2>
          <p className="text-lg text-muted-foreground">
            Three simple steps from blank page to polished resume.
          </p>
        </div>
        <div className="relative grid w-full max-w-5xl grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary">
                <feature.icon className="h-6 w-6 shrink-0 text-white" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="text-[15px] leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <Separator />
      <footer className="flex h-16 items-center justify-center px-20 shadow-[0_-1px_3px_rgba(0,0,0,0.04)] transition-all duration-500 hover:bg-primary/[0.03] hover:shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        <p className="text-sm text-muted-foreground">
          © 2026 EasyCV. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
