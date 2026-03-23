// Temporary design token verification page — will be replaced in Phase 2 (Issue #10)

export default function Home() {
  return (
    <main className="min-h-screen p-12" style={{ backgroundColor: "var(--color-muted)" }}>
      <div className="max-w-2xl mx-auto flex flex-col gap-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--color-foreground)" }}>
            EasyCV Design Tokens
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            Tailwind CSS v4 · Apple Style
          </p>
        </div>

        {/* Colors */}
        <section className="rounded-xl p-6 flex flex-col gap-4" style={{ backgroundColor: "var(--color-card)", boxShadow: "var(--shadow-md)" }}>
          <h2 className="text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>COLORS</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { name: "primary", bg: "var(--color-primary)" },
              { name: "foreground", bg: "var(--color-foreground)" },
              { name: "muted", bg: "var(--color-muted)" },
              { name: "border", bg: "var(--color-border)" },
              { name: "destructive", bg: "var(--color-destructive)" },
              { name: "success", bg: "var(--color-success)" },
            ].map(({ name, bg }) => (
              <div key={name} className="flex flex-col items-center gap-1">
                <div className="w-14 h-14 rounded-lg border" style={{ backgroundColor: bg, borderColor: "var(--color-border)" }} />
                <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section className="rounded-xl p-6 flex flex-col gap-3" style={{ backgroundColor: "var(--color-card)", boxShadow: "var(--shadow-md)" }}>
          <h2 className="text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>TYPOGRAPHY</h2>
          <p className="text-3xl font-bold tracking-tight">Professional Resumes</p>
          <p className="text-xl font-semibold">Effortlessly crafted</p>
          <p className="text-base" style={{ color: "var(--color-muted-foreground)" }}>Focus on your content — EasyCV handles the layout.</p>
          <p className="text-sm font-mono" style={{ color: "var(--color-primary)" }}>Geist Mono — code & accents</p>
        </section>

        {/* Shadows */}
        <section className="rounded-xl p-6 flex flex-col gap-4" style={{ backgroundColor: "var(--color-card)", boxShadow: "var(--shadow-md)" }}>
          <h2 className="text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>SHADOWS</h2>
          <div className="flex flex-wrap gap-6 items-end">
            {[
              { name: "xs", shadow: "var(--shadow-xs)" },
              { name: "sm", shadow: "var(--shadow-sm)" },
              { name: "md", shadow: "var(--shadow-md)" },
              { name: "lg", shadow: "var(--shadow-lg)" },
              { name: "xl", shadow: "var(--shadow-xl)" },
            ].map(({ name, shadow }) => (
              <div key={name} className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-xl bg-white" style={{ boxShadow: shadow }} />
                <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Border Radius */}
        <section className="rounded-xl p-6 flex flex-col gap-4" style={{ backgroundColor: "var(--color-card)", boxShadow: "var(--shadow-md)" }}>
          <h2 className="text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>BORDER RADIUS</h2>
          <div className="flex flex-wrap gap-4 items-end">
            {[
              { name: "xs (6px)", r: "var(--radius-xs)" },
              { name: "sm (8px)", r: "var(--radius-sm)" },
              { name: "md (12px)", r: "var(--radius-md)" },
              { name: "lg (16px)", r: "var(--radius-lg)" },
              { name: "xl (20px)", r: "var(--radius-xl)" },
              { name: "full", r: "var(--radius-full)" },
            ].map(({ name, r }) => (
              <div key={name} className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 border-2" style={{ borderRadius: r, borderColor: "var(--color-primary)", backgroundColor: "var(--color-muted)" }} />
                <span className="text-xs text-center" style={{ color: "var(--color-muted-foreground)" }}>{name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Buttons preview */}
        <section className="rounded-xl p-6 flex flex-col gap-4" style={{ backgroundColor: "var(--color-card)", boxShadow: "var(--shadow-md)" }}>
          <h2 className="text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>BUTTONS (PREVIEW)</h2>
          <div className="flex flex-wrap gap-3 items-center">
            <button className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-all" style={{ backgroundColor: "var(--color-primary)", borderRadius: "var(--radius-sm)" }}>
              Primary
            </button>
            <button className="px-5 py-2 rounded-lg text-sm font-medium border transition-all" style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)", borderRadius: "var(--radius-sm)" }}>
              Secondary
            </button>
            <button className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-all" style={{ backgroundColor: "var(--color-destructive)", borderRadius: "var(--radius-sm)" }}>
              Destructive
            </button>
          </div>
        </section>

      </div>
    </main>
  );
}
