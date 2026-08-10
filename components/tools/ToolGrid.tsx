import {
  ArrowRight,
  Combine,
  FileImage,
  FileOutput,
  FileText,
  Image,
  LockKeyhole,
  Minimize2,
  RotateCw,
  Scissors,
  ShieldCheck,
  Stamp,
} from "lucide-react";
import Link from "next/link";

const tools = [
  {
    title: "Merge PDF",
    description: "Combine multiple PDF files into one document.",
    href: "/merge",
    icon: Combine,
  },
  {
    title: "Compress PDF",
    description: "Reduce PDF file size while keeping quality.",
    href: "/compress",
    icon: Minimize2,
  },
  {
    title: "Split PDF",
    description: "Extract pages or split a PDF into smaller files.",
    href: "/split-pdf",
    icon: Scissors,
  },
  {
    title: "Image to PDF",
    description: "Turn JPG, PNG, and other images into PDF files.",
    href: "/image-to-pdf",
    icon: FileImage,
  },
  {
    title: "PDF to Image",
    description: "Convert PDF pages into high-quality images.",
    href: "/pdf-to-image",
    icon: Image,
  },
  {
    title: "PDF to Word",
    description: "Convert PDF documents into editable Word files.",
    href: "/pdf-to-word",
    icon: FileOutput,
  },
  {
  title: "Rotate PDF",
  description: "Rotate PDF pages to the correct orientation.",
  href: "/rotate-pdf",
  icon: RotateCw,
},
  {
    title: "Watermark PDF",
    description: "Add a custom watermark to your PDF documents.",
    href: "/watermark",
    icon: Stamp,
  },
  {
    title: "Protect PDF",
    description: "Secure your PDF with password protection.",
    href: "/protect",
    icon: LockKeyhole,
  },
  {
    title: "Unlock PDF",
    description: "Remove password protection from supported PDFs.",
    href: "/unlock",
    icon: ShieldCheck,
  },

  {
  title: "PDF Page Manager",
  description: "Reorder, remove, and manage PDF pages.",
  href: "/pdf-page-manager",
  icon: FileText,
  },
  
];

export default function ToolGrid() {
  return (
    <section id="tools" className="border-b border-white/10 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-white/40">
            Popular tools
          </p>

          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Everything you need
            <span className="text-white/40"> for your PDFs.</span>
          </h2>

          <p className="mt-5 text-base leading-7 text-white/50 sm:text-lg">
            Powerful PDF utilities designed to keep your workflow simple,
            fast, and organized.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const Icon = tool.icon;

            return (
              <Link
                key={tool.title}
                href={tool.href}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div className="mb-8 flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
                    <Icon className="h-5 w-5 text-white/80" />
                  </div>

                  <ArrowRight className="h-5 w-5 text-white/20 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white/70" />
                </div>

                <h3 className="text-lg font-medium text-white">
                  {tool.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-white/45">
                  {tool.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}