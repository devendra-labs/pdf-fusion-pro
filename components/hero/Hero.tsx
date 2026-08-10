import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-24 h-[420px] w-[700px] -translate-x-1/2 rounded-full bg-white/[0.04] blur-3xl" />

        <div className="absolute left-1/2 top-1/2 h-[280px] w-[500px] -translate-x-1/2 rounded-full bg-white/[0.025] blur-3xl" />
      </div>

      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center px-6 py-24 sm:py-32 lg:py-36">
        <div className="mx-auto max-w-5xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/60 shadow-[0_0_30px_rgba(255,255,255,0.03)] backdrop-blur-md">
            <Sparkles className="h-4 w-4 text-white/80" />

            <span>
              Simple. Powerful. Privacy-focused.
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-balance text-5xl font-semibold tracking-[-0.055em] text-white sm:text-6xl md:text-7xl lg:text-[5.5rem] lg:leading-[0.98]">
            Every PDF tool.
            <br />
            <span className="bg-gradient-to-b from-white to-white/35 bg-clip-text text-transparent">
              One beautiful workspace.
            </span>
          </h1>

          {/* Description */}
          <p className="mx-auto mt-8 max-w-2xl text-pretty text-base leading-7 text-white/50 sm:text-lg sm:leading-8">
            Merge, compress, split, convert, rotate,
            protect, and manage your PDF files with a
            fast and modern toolkit built for everyday
            work.
          </p>

          {/* Actions */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/merge"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-medium text-black shadow-[0_8px_30px_rgba(255,255,255,0.08)] transition-all duration-200 hover:scale-[1.02] hover:bg-white/90 active:scale-[0.98]"
            >
              Start with Merge PDF

              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>

            <a
              href="#tools"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-6 text-sm font-medium text-white/75 backdrop-blur-md transition-all duration-200 hover:border-white/15 hover:bg-white/[0.08] hover:text-white active:scale-[0.98]"
            >
              Explore all tools
            </a>
          </div>

          {/* Trust line */}
          <div className="mt-9 flex items-center justify-center gap-3 text-xs text-white/30">
            <span>Built with modern web technologies</span>

            <span
              className="h-1 w-1 rounded-full bg-white/20"
              aria-hidden="true"
            />

            <span>Designed for speed</span>
          </div>

          {/* Bottom visual hint */}
          <div className="mx-auto mt-16 flex max-w-xl items-center justify-center gap-3 text-xs text-white/20">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />

            <span>Explore your PDF toolkit</span>

            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
          </div>
        </div>
      </div>
    </section>
  );
}