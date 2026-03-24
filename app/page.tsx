import { PenLine, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Navbar */}
      <nav className="flex h-18 items-center justify-between px-20">
        <span className="text-xl font-bold tracking-tight">
          Easy<span className="text-primary">CV</span>
        </span>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="rounded-full px-4">
            Sign In
          </Button>
          <Button className="rounded-full px-4">Get Started</Button>
        </div>
      </nav>

      <Separator />

      {/* Hero */}
      <section className="relative flex flex-col items-center gap-8 px-20 py-30 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,113,227,0.06)_0%,transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(0,113,227,0.06)_0%,transparent_50%)]" />
        <div className="relative flex items-center gap-1.5 rounded-full bg-secondary px-4 py-1.5">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">
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
          <Button size="lg" className="h-12 rounded-full px-6 text-base">
            Start Building — It&apos;s Free
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-12 rounded-full px-6 text-base"
          >
            See Examples
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="relative flex flex-col items-center gap-16 bg-[#f5f5f7] px-20 py-24 overflow-hidden">
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
              className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-8"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                <feature.icon className="h-6 w-6 text-white" />
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
      <footer className="flex h-16 items-center justify-center px-20">
        <p className="text-sm text-muted-foreground">
          © 2026 EasyCV. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
