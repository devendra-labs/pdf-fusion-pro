"use client";

import Link from "next/link";
import {
  ChevronDown,
  FileText,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const tools = [
  {
    name: "Merge PDF",
    href: "/merge",
  },
  {
    name: "Compress PDF",
    href: "/compress",
  },
  {
    name: "Image to PDF",
    href: "/image-to-pdf",
  },
  {
    name: "PDF to Image",
    href: "/pdf-to-image",
  },
  {
    name: "PDF to Word",
    href: "/pdf-to-word",
  },
  {
    name: "PDF Page Manager",
    href: "/pdf-page-manager",
  },
  {
    name: "Split PDF",
    href: "/split-pdf",
  },
  {
    name: "Rotate PDF",
    href: "/rotate-pdf",
  },
  {
    name: "Watermark PDF",
    href: "/watermark",
  },
  {
    name: "Protect PDF",
    href: "/protect",
  },
  {
    name: "Unlock PDF",
    href: "/unlock",
  },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] =
    useState(false);

  const closeMobileMenu = () => {
    setIsOpen(false);
    setIsToolsOpen(false);
  };

  return (
    <header className="border-b border-white/10 bg-black">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          onClick={closeMobileMenu}
          className="flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black">
            <FileText className="h-6 w-6" />
          </div>

          <span className="text-lg font-semibold tracking-tight text-white">
            PDF Fusion{" "}
            <span className="text-white/50">
              Pro
            </span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/merge"
            className="rounded-lg px-4 py-2 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            Merge PDF
          </Link>

          <Link
            href="/compress"
            className="rounded-lg px-4 py-2 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            Compress
          </Link>

          <Link
            href="/image-to-pdf"
            className="rounded-lg px-4 py-2 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            Image to PDF
          </Link>

          {/* All Tools Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setIsToolsOpen(
                  (value) => !value,
                )
              }
              className="inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              aria-expanded={isToolsOpen}
              aria-haspopup="menu"
            >
              All Tools

              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isToolsOpen
                    ? "rotate-180"
                    : ""
                }`}
              />
            </button>

            {isToolsOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-white/10 bg-black/95 p-2 shadow-2xl backdrop-blur-xl">
                <div className="px-3 py-2">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/30">
                    PDF Tools
                  </p>
                </div>

                <div className="grid gap-1">
                  {tools.map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      onClick={() =>
                        setIsToolsOpen(false)
                      }
                      className="rounded-xl px-3 py-2.5 text-sm text-white/65 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      {tool.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <a
            href="#tools"
            className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-transform hover:scale-[1.02] hover:bg-white/90"
          >
            Explore Tools
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => {
            setIsOpen((value) => !value);

            if (isOpen) {
              setIsToolsOpen(false);
            }
          }}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10 md:hidden"
          aria-label={
            isOpen
              ? "Close menu"
              : "Open menu"
          }
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="border-t border-white/10 bg-black/95 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            <Link
              href="/merge"
              onClick={closeMobileMenu}
              className="rounded-lg px-4 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white"
            >
              Merge PDF
            </Link>

            <Link
              href="/compress"
              onClick={closeMobileMenu}
              className="rounded-lg px-4 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white"
            >
              Compress PDF
            </Link>

            <Link
              href="/image-to-pdf"
              onClick={closeMobileMenu}
              className="rounded-lg px-4 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white"
            >
              Image to PDF
            </Link>

            {/* Mobile All Tools */}
            <div className="rounded-lg">
              <button
                type="button"
                onClick={() =>
                  setIsToolsOpen(
                    (value) => !value,
                  )
                }
                className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white"
                aria-expanded={isToolsOpen}
              >
                <span>All Tools</span>

                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    isToolsOpen
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </button>

              {isToolsOpen && (
                <div className="mt-1 space-y-1 border-l border-white/10 pl-3">
                  {tools.map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      onClick={
                        closeMobileMenu
                      }
                      className="block rounded-lg px-4 py-2.5 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      {tool.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}