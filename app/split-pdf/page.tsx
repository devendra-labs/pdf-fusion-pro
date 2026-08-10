"use client";

import Link from "next/link";
import {
  ArrowLeft,
  FileUp,
  X,
  Scissors,
  Download,
} from "lucide-react";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";

type SplitMode = "range" | "pages";

export default function SplitPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitMode, setSplitMode] =
    useState<SplitMode>("range");

  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");

  const [pageNumbers, setPageNumbers] = useState("");

  const [resultBlob, setResultBlob] =
    useState<Blob | null>(null);

  const [resultPages, setResultPages] =
    useState<number | null>(null);

  const [isComplete, setIsComplete] = useState(false);

  const handleFile = (selectedFile: File | null) => {
    if (!selectedFile) return;

    if (
      selectedFile.type !== "application/pdf" &&
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please select a valid PDF file.");
      return;
    }

    setFile(selectedFile);
    setError("");
    setResultBlob(null);
    setResultPages(null);
    setIsComplete(false);

    setRangeStart("");
    setRangeEnd("");
    setPageNumbers("");
  };

  const handleRemoveFile = () => {
    if (isSplitting) return;

    setFile(null);
    setError("");
    setResultBlob(null);
    setResultPages(null);
    setIsComplete(false);

    setRangeStart("");
    setRangeEnd("");
    setPageNumbers("");
  };

  const handleSplitAnother = () => {
    setFile(null);
    setError("");
    setResultBlob(null);
    setResultPages(null);
    setIsComplete(false);

    setRangeStart("");
    setRangeEnd("");
    setPageNumbers("");
    setSplitMode("range");
  };

  const parsePageNumbers = (
    value: string,
    totalPages: number,
  ): number[] => {
    const pages = new Set<number>();

    const parts = value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    for (const part of parts) {
      if (part.includes("-")) {
        const [startText, endText] = part
          .split("-")
          .map((item) => item.trim());

        const start = Number(startText);
        const end = Number(endText);

        if (
          !Number.isInteger(start) ||
          !Number.isInteger(end) ||
          start < 1 ||
          end < 1 ||
          start > end ||
          end > totalPages
        ) {
          throw new Error(
            `Invalid page range: ${part}`,
          );
        }

        for (let page = start; page <= end; page++) {
          pages.add(page);
        }
      } else {
        const page = Number(part);

        if (
          !Number.isInteger(page) ||
          page < 1 ||
          page > totalPages
        ) {
          throw new Error(
            `Invalid page number: ${part}`,
          );
        }

        pages.add(page);
      }
    }

    return Array.from(pages).sort(
      (a, b) => a - b,
    );
  };

  const handleSplit = async () => {
    if (!file) {
      setError("Please select a PDF file first.");
      return;
    }

    try {
      setIsSplitting(true);
      setError("");
      setResultBlob(null);
      setResultPages(null);
      setIsComplete(false);

      const fileBytes = await file.arrayBuffer();

      const sourcePdf = await PDFDocument.load(
        fileBytes,
      );

      const totalPages = sourcePdf.getPageCount();

      if (totalPages === 0) {
        throw new Error(
          "The PDF does not contain any pages.",
        );
      }

      let selectedPages: number[] = [];

      if (splitMode === "range") {
        const start = Number(rangeStart);
        const end = Number(rangeEnd);

        if (
          !Number.isInteger(start) ||
          !Number.isInteger(end)
        ) {
          throw new Error(
            "Please enter a valid start and end page.",
          );
        }

        if (
          start < 1 ||
          end < 1 ||
          start > end ||
          end > totalPages
        ) {
          throw new Error(
            `Please enter a page range between 1 and ${totalPages}.`,
          );
        }

        for (let page = start; page <= end; page++) {
          selectedPages.push(page);
        }
      } else {
        if (!pageNumbers.trim()) {
          throw new Error(
            "Please enter the page numbers you want to extract.",
          );
        }

        selectedPages = parsePageNumbers(
          pageNumbers,
          totalPages,
        );
      }

      if (selectedPages.length === 0) {
        throw new Error(
          "Please select at least one page.",
        );
      }

      const outputPdf =
        await PDFDocument.create();

      const pageIndexes = selectedPages.map(
        (page) => page - 1,
      );

      const copiedPages =
        await outputPdf.copyPages(
          sourcePdf,
          pageIndexes,
        );

      for (const page of copiedPages) {
        outputPdf.addPage(page);
      }

      const outputBytes =
        await outputPdf.save();

      const outputBuffer = outputBytes.buffer.slice(
  outputBytes.byteOffset,
  outputBytes.byteOffset + outputBytes.byteLength,
) as ArrayBuffer;

const blob = new Blob([outputBuffer], {
  type: "application/pdf",
});

      setResultBlob(blob);
      setResultPages(selectedPages.length);
      setIsComplete(true);
    } catch (err) {
      console.error(
        "[Split PDF] Error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while splitting the PDF.",
      );
    } finally {
      setIsSplitting(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob || !file) return;

    const url =
      URL.createObjectURL(resultBlob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download = file.name.replace(
      /\.pdf$/i,
      "-split.pdf",
    );

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(
      size /
      1024 /
      1024
    ).toFixed(2)} MB`;
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mt-16 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-white/40">
            PDF Tool
          </p>

          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Split PDF
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/50 sm:text-lg">
            Extract selected pages from a PDF
            and create a new PDF document.
          </p>
        </div>

        <div className="mt-12 rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center backdrop-blur-sm sm:p-14">
          {!file && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                <FileUp className="h-7 w-7 text-white/70" />
              </div>

              <h2 className="mt-6 text-xl font-medium text-white">
                Upload your PDF
              </h2>

              <p className="mt-2 text-sm text-white/40">
                Select a PDF to extract specific
                pages from it.
              </p>

              <label className="mt-7 inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-white px-5 text-sm font-medium text-black transition-transform hover:scale-[1.02] hover:bg-white/90">
                Choose PDF file

                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(event) => {
                    handleFile(
                      event.target.files?.[0] ??
                        null,
                    );

                    event.target.value = "";
                  }}
                />
              </label>

              <p className="mt-4 text-xs text-white/25">
                PDF files only
              </p>
            </>
          )}

          {file && !isComplete && (
            <>
              <div className="mx-auto max-w-xl rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white/80">
                      {file.name}
                    </p>

                    <p className="mt-1 text-xs text-white/30">
                      {formatFileSize(
                        file.size,
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      handleRemoveFile
                    }
                    disabled={isSplitting}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Remove PDF"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <label className="mt-4 inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm text-white/60 transition-colors hover:bg-white/[0.1] hover:text-white">
                Replace PDF

                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  disabled={isSplitting}
                  onChange={(event) => {
                    handleFile(
                      event.target.files?.[0] ??
                        null,
                    );

                    event.target.value = "";
                  }}
                />
              </label>

              <div className="mx-auto mt-8 max-w-xl text-left">
                <p className="mb-3 text-sm font-medium text-white/70">
                  Split method
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSplitMode("range")
                    }
                    disabled={isSplitting}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      splitMode === "range"
                        ? "border-white/30 bg-white/[0.08]"
                        : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
                    }`}
                  >
                    <p className="text-sm font-medium text-white/80">
                      Page range
                    </p>

                    <p className="mt-1 text-xs text-white/35">
                      Example: pages 2 to 5
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setSplitMode("pages")
                    }
                    disabled={isSplitting}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      splitMode === "pages"
                        ? "border-white/30 bg-white/[0.08]"
                        : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
                    }`}
                  >
                    <p className="text-sm font-medium text-white/80">
                      Specific pages
                    </p>

                    <p className="mt-1 text-xs text-white/35">
                      Example: 1, 3, 5-7
                    </p>
                  </button>
                </div>

                {splitMode === "range" && (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs text-white/40">
                        Start page
                      </label>

                      <input
                        type="number"
                        min="1"
                        value={rangeStart}
                        onChange={(event) =>
                          setRangeStart(
                            event.target.value,
                          )
                        }
                        disabled={isSplitting}
                        placeholder="1"
                        className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs text-white/40">
                        End page
                      </label>

                      <input
                        type="number"
                        min="1"
                        value={rangeEnd}
                        onChange={(event) =>
                          setRangeEnd(
                            event.target.value,
                          )
                        }
                        disabled={isSplitting}
                        placeholder="5"
                        className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
                      />
                    </div>
                  </div>
                )}

                {splitMode === "pages" && (
                  <div className="mt-5">
                    <label className="mb-2 block text-xs text-white/40">
                      Page numbers
                    </label>

                    <input
                      type="text"
                      value={pageNumbers}
                      onChange={(event) =>
                        setPageNumbers(
                          event.target.value,
                        )
                      }
                      disabled={isSplitting}
                      placeholder="Example: 1, 3, 5-7"
                      className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
                    />

                    <p className="mt-2 text-xs text-white/25">
                      Use commas for separate pages
                      and hyphens for ranges.
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleSplit}
                disabled={isSplitting}
                className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-medium text-black transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Scissors className="h-4 w-4" />

                {isSplitting
                  ? "Splitting PDF..."
                  : "Split PDF"}
              </button>
            </>
          )}

          {isComplete &&
            file &&
            resultBlob &&
            resultPages !== null && (
              <div className="mx-auto max-w-xl">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-2xl">
                  ✓
                </div>

                <h2 className="mt-6 text-2xl font-semibold text-white">
                  PDF split complete
                </h2>

                <p className="mt-2 text-sm text-white/40">
                  Your selected pages are ready
                  to download.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left">
                    <p className="text-xs text-white/35">
                      Pages extracted
                    </p>

                    <p className="mt-1 text-lg font-medium text-white/80">
                      {resultPages}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left">
                    <p className="text-xs text-white/35">
                      Output size
                    </p>

                    <p className="mt-1 text-lg font-medium text-white/80">
                      {formatFileSize(
                        resultBlob.size,
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-medium text-black transition-all hover:bg-white/90"
                  >
                    <Download className="h-4 w-4" />
                    Download split PDF
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleSplitAnother
                    }
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-6 text-sm font-medium text-white transition-all hover:bg-white/[0.1]"
                  >
                    Split another PDF
                  </button>
                </div>
              </div>
            )}

          {error && (
            <p className="mx-auto mt-5 max-w-md text-sm text-red-400">
              {error}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}