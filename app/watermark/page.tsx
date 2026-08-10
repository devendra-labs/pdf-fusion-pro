"use client";

import Link from "next/link";
import { ArrowLeft, FileUp, X, Download } from "lucide-react";
import { useState } from "react";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  degrees,
} from "pdf-lib";

type Position =
  | "center"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export default function WatermarkPage() {
  const [file, setFile] = useState<File | null>(null);
  const [watermarkText, setWatermarkText] =
    useState("CONFIDENTIAL");
  const [position, setPosition] =
    useState<Position>("center");
  const [opacity, setOpacity] = useState(0.25);
  const [fontSize, setFontSize] = useState(48);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const [resultBlob, setResultBlob] =
    useState<Blob | null>(null);
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
    setIsComplete(false);
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    setIsDragging(false);

    const droppedFile =
      event.dataTransfer.files?.[0] ?? null;

    handleFile(droppedFile);
  };

  const handleRemoveFile = () => {
    if (isProcessing) return;

    setFile(null);
    setError("");
    setResultBlob(null);
    setIsComplete(false);
  };

  const handleAnotherPDF = () => {
    setFile(null);
    setError("");
    setResultBlob(null);
    setIsComplete(false);
    setWatermarkText("CONFIDENTIAL");
    setPosition("center");
    setOpacity(0.25);
    setFontSize(48);
  };

  const getPosition = (
    pageWidth: number,
    pageHeight: number,
    textWidth: number,
  ) => {
    const margin = 40;

    switch (position) {
      case "top-left":
        return {
          x: margin,
          y: pageHeight - margin - fontSize,
        };

      case "top-right":
        return {
          x: pageWidth - textWidth - margin,
          y: pageHeight - margin - fontSize,
        };

      case "bottom-left":
        return {
          x: margin,
          y: margin,
        };

      case "bottom-right":
        return {
          x: pageWidth - textWidth - margin,
          y: margin,
        };

      case "center":
      default:
        return {
          x: (pageWidth - textWidth) / 2,
          y: (pageHeight - fontSize) / 2,
        };
    }
  };

  const handleApplyWatermark = async () => {
    if (!file) {
      setError("Please select a PDF file first.");
      return;
    }

    if (!watermarkText.trim()) {
      setError("Please enter watermark text.");
      return;
    }

    try {
      setIsProcessing(true);
      setError("");
      setResultBlob(null);
      setIsComplete(false);

      const fileBytes = await file.arrayBuffer();

      const pdfDoc =
        await PDFDocument.load(fileBytes);

      const font = await pdfDoc.embedFont(
        StandardFonts.HelveticaBold,
      );

      const pages = pdfDoc.getPages();

      for (const page of pages) {
        const { width, height } =
          page.getSize();

        const textWidth = font.widthOfTextAtSize(
          watermarkText.trim(),
          fontSize,
        );

        const { x, y } = getPosition(
          width,
          height,
          textWidth,
        );

        page.drawText(
          watermarkText.trim(),
          {
            x,
            y,
            size: fontSize,
            font,
            color: rgb(0.45, 0.45, 0.45),
            opacity,
            rotate:
              position === "center"
                ? degrees(-45)
                : degrees(0),
          },
        );
      }

      const pdfBytes = await pdfDoc.save();

      const outputBuffer = pdfBytes.buffer.slice(
  pdfBytes.byteOffset,
  pdfBytes.byteOffset + pdfBytes.byteLength,
) as ArrayBuffer;

const blob = new Blob([outputBuffer], {
  type: "application/pdf",
});

      setResultBlob(blob);
      setIsComplete(true);
    } catch (err) {
      console.error(
        "Watermark PDF error:",
        err,
      );

      setError(
        "Something went wrong while adding the watermark. Please make sure the PDF is valid.",
      );
    } finally {
      setIsProcessing(false);
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
      "-watermarked.pdf",
    );

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-[#08090b] px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mt-16 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-white/40">
            PDF Tool
          </p>

          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Watermark PDF
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/50 sm:text-lg">
            Add a custom text watermark to every
            page of your PDF.
          </p>
        </div>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          className={`mt-12 rounded-3xl border border-dashed p-8 text-center backdrop-blur-sm transition-all sm:p-14 ${
            isDragging
              ? "scale-[1.01] border-white/40 bg-white/[0.08]"
              : "border-white/15 bg-white/[0.03]"
          }`}
        >
          {!file && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                <FileUp className="h-7 w-7 text-white/70" />
              </div>

              <h2 className="mt-6 text-xl font-medium text-white">
                {isDragging
                  ? "Drop your PDF here"
                  : "Upload your PDF"}
              </h2>

              <p className="mt-2 text-sm text-white/40">
                Drag and drop a PDF here or choose
                a file from your computer.
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
                      PDF file selected
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    disabled={isProcessing}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Remove PDF"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mx-auto mt-7 max-w-xl text-left">
                <label className="text-sm font-medium text-white/70">
                  Watermark text
                </label>

                <input
                  type="text"
                  value={watermarkText}
                  onChange={(event) =>
                    setWatermarkText(
                      event.target.value,
                    )
                  }
                  disabled={isProcessing}
                  placeholder="Enter watermark text"
                  className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/25"
                />
              </div>

              <div className="mx-auto mt-5 max-w-xl text-left">
                <p className="mb-3 text-sm font-medium text-white/70">
                  Position
                </p>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {[
                    ["top-left", "Top left"],
                    ["top-right", "Top right"],
                    ["center", "Center"],
                    ["bottom-left", "Bottom left"],
                    ["bottom-right", "Bottom right"],
                  ].map(
                    ([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        disabled={isProcessing}
                        onClick={() =>
                          setPosition(
                            value as Position,
                          )
                        }
                        className={`rounded-xl border px-3 py-3 text-xs transition-colors ${
                          position === value
                            ? "border-white/30 bg-white/[0.12] text-white"
                            : "border-white/10 bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white"
                        }`}
                      >
                        {label}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="mx-auto mt-6 max-w-xl text-left">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white/70">
                    Font size
                  </p>

                  <span className="text-xs text-white/40">
                    {fontSize}px
                  </span>
                </div>

                <input
                  type="range"
                  min="20"
                  max="100"
                  step="1"
                  value={fontSize}
                  onChange={(event) =>
                    setFontSize(
                      Number(event.target.value),
                    )
                  }
                  disabled={isProcessing}
                  className="mt-3 w-full accent-white"
                />
              </div>

              <div className="mx-auto mt-6 max-w-xl text-left">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white/70">
                    Opacity
                  </p>

                  <span className="text-xs text-white/40">
                    {Math.round(opacity * 100)}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0.05"
                  max="0.8"
                  step="0.05"
                  value={opacity}
                  onChange={(event) =>
                    setOpacity(
                      Number(event.target.value),
                    )
                  }
                  disabled={isProcessing}
                  className="mt-3 w-full accent-white"
                />
              </div>

              <button
                type="button"
                onClick={
                  handleApplyWatermark
                }
                disabled={isProcessing}
                className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-sm font-medium text-black transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isProcessing
                  ? "Adding watermark..."
                  : "Add Watermark"}
              </button>
            </>
          )}

          {isComplete && resultBlob && (
            <div className="mx-auto max-w-xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-2xl">
                ✓
              </div>

              <h2 className="mt-6 text-2xl font-semibold text-white">
                Watermark added
              </h2>

              <p className="mt-2 text-sm text-white/40">
                Your watermarked PDF is ready to
                download.
              </p>

              <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left">
                <p className="text-xs text-white/35">
                  Watermark
                </p>

                <p className="mt-1 truncate text-lg font-medium text-white/80">
                  {watermarkText}
                </p>
              </div>

              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-medium text-black transition-all hover:bg-white/90"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>

                <button
                  type="button"
                  onClick={handleAnotherPDF}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-6 text-sm font-medium text-white transition-all hover:bg-white/[0.1]"
                >
                  Watermark another PDF
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