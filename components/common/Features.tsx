import {
  Gauge,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Gauge,
    title: "Fast by design",
    description:
      "A clean workflow focused on getting your PDF tasks done without unnecessary steps.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy focused",
    description:
      "Whenever possible, PDF processing can happen directly in your browser instead of sending files to third-party services.",
  },
  {
    icon: Lock,
    title: "Built with security in mind",
    description:
      "We design every tool with sensible file handling and privacy considerations from the start.",
  },
  {
    icon: Sparkles,
    title: "Simple experience",
    description:
      "Powerful PDF utilities wrapped in a focused interface that stays easy to understand.",
  },
];

export default function Features() {
  return (
    <section className="relative overflow-hidden border-t border-white/[0.06]">
      {/* Subtle background glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-white/[0.025] blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32">
        {/* Section heading */}
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-white/35">
            Why PDF Fusion Pro
          </p>

          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl sm:leading-tight">
            Built for a better
            <span className="text-white/40">
              {" "}
              PDF workflow.
            </span>
          </h2>

          <p className="mt-5 max-w-xl text-base leading-7 text-white/50 sm:text-lg">
            Everything is designed around speed,
            simplicity, privacy, and a
            distraction-free experience.
          </p>
        </div>

        {/* Feature cards */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.055]"
              >
                <div className="mb-7 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] transition-colors duration-300 group-hover:border-white/20 group-hover:bg-white/[0.08]">
                  <Icon className="h-5 w-5 text-white/75 transition-colors group-hover:text-white" />
                </div>

                <h3 className="text-lg font-medium text-white">
                  {feature.title}
                </h3>

                <p className="mt-2 max-w-lg text-sm leading-6 text-white/45">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}