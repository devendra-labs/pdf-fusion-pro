import { FileText } from "lucide-react";
import Link from "next/link";

const toolLinks = [
  { label: "Merge PDF", href: "/merge" },
  { label: "Compress PDF", href: "/compress" },
  { label: "Split PDF", href: "/split-pdf" },
  { label: "Image to PDF", href: "/image-to-pdf" },
];

const conversionLinks = [
  { label: "PDF to Image", href: "/pdf-to-image" },
  { label: "PDF to Word", href: "/pdf-to-word" },
  { label: "Rotate PDF", href: "/rotate-pdf" },
  { label: "PDF Page Manager", href: "/pdf-page-manager" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-black">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        {/* Main footer content */}
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
                <FileText className="h-4 w-4 text-white/80" />
              </div>

              <span className="text-lg font-semibold tracking-tight text-white">
                PDF Fusion{" "}
                <span className="text-white/40">
                  Pro
                </span>
              </span>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-6 text-white/40">
              A modern all-in-one PDF toolkit built
              to make everyday document workflows
              faster, simpler, and more private.
            </p>
          </div>

          {/* PDF Tools */}
          <div>
            <h3 className="text-sm font-medium text-white">
              PDF Tools
            </h3>

            <nav
              className="mt-5 flex flex-col gap-3"
              aria-label="PDF tools"
            >
              {toolLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="w-fit text-sm text-white/40 transition-colors duration-200 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Convert & Manage */}
          <div>
            <h3 className="text-sm font-medium text-white">
              Convert & Manage
            </h3>

            <nav
              className="mt-5 flex flex-col gap-3"
              aria-label="Convert and manage tools"
            >
              {conversionLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="w-fit text-sm text-white/40 transition-colors duration-200 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col gap-4 border-t border-white/[0.06] pt-6 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © 2026 PDF Fusion Pro. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}