"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileUp,
  RotateCw,
  X,
} from "lucide-react";
import { useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";

type Rotation = 90 | 180 | 270;

export default function RotatePdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [rotation, setRotation] =
    useState<Rotation>(90);
  const [isRotating, setIsRotating] = useState(false);
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
  };

  const handleRemoveFile = () => {
    if (isRotating) return;

    setFile(null);
    setError("");
    setResultBlob(null);
    setResultPages(null);
    setIsComplete(false);
  };

  const handleRotateAnother = () => {
    setFile(null);
    setError("");
    setResultBlob(null);
    setResultPages(null);
    setIsComplete(false);
    setRotation(90);
  };

  const handleRotate = async () => {
    if (!file) {
      setError("Please select a PDF file first.");
      return;
    }

    try {
      setIsRotating(true);
      setError("");
      setResultBlob(null);
      setResultPages(null);
      setIsComplete(false);

      const fileBytes = await file.arrayBuffer();

      const pdfDoc = await PDFDocument.load(fileBytes);

      const pages = pdfDoc.getPages();

      if (pages.length === 0) {
        throw new Error(
          "The PDF does not contain any pages.",
        );
      }

      for (const page of pages) {
        const currentRotation =
          page.getRotation().angle;

        page.setRotation(
          degrees(
            currentRotation + rotation,
          ),
        );
      }

      const outputBytes = await pdfDoc.save();

const outputBuffer = outputBytes.buffer.slice(
  outputBytes.byteOffset,
  outputBytes.byteOffset + outputBytes.byteLength,
) as ArrayBuffer;

const blob = new Blob([outputBuffer], {
  type: "application/pdf",
});

      setResultBlob(blob);
      setResultPages(pages.length);
      setIsComplete(true);
    } catch (err) {
      console.error(
        "[Rotate PDF] Error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while rotating the PDF.",
      );
    } finally {
      setIsRotating(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob || !file) return;

    const url = URL.createObjectURL(resultBlob);

    const link = document.createElement("a");

    link.href = url;

    link.download = file.name.replace(
      /\.pdf$/i,
      "-rotated.pdf",
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
            Rotate PDF
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/50 sm:text-lg">
            Rotate every page in your PDF and
            download the updated document.
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
                Select a PDF and choose how much
                you want to rotate it.
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
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    disabled={isRotating}
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
                  disabled={isRotating}
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
                  Rotation angle
                </p>

                <div className="grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setRotation(90)}
                    disabled={isRotating}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      rotation === 90
                        ? "border-white/30 bg-white/[0.08]"
                        : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
                    }`}
                  >
                    <RotateCw className="mb-3 h-5 w-5 text-white/60" />

                    <p className="text-sm font-medium text-white/80">
                      90°
                    </p>

                    <p className="mt-1 text-xs text-white/35">
                      Clockwise
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRotation(180)}
                    disabled={isRotating}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      rotation === 180
                        ? "border-white/30 bg-white/[0.08]"
                        : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
                    }`}
                  >
                    <RotateCw className="mb-3 h-5 w-5 text-white/60" />

                    <p className="text-sm font-medium text-white/80">
                      180°
                    </p>

                    <p className="mt-1 text-xs text-white/35">
                      Half turn
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRotation(270)}
                    disabled={isRotating}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      rotation === 270
                        ? "border-white/30 bg-white/[0.08]"
                        : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
                    }`}
                  >
                    <RotateCw className="mb-3 h-5 w-5 text-white/60" />

                    <p className="text-sm font-medium text-white/80">
                      270°
                    </p>

                    <p className="mt-1 text-xs text-white/35">
                      Clockwise
                    </p>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRotate}
                disabled={isRotating}
                className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-medium text-black transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCw className="h-4 w-4" />

                {isRotating
                  ? "Rotating PDF..."
                  : `Rotate PDF ${rotation}°`}
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
                  Rotation complete
                </h2>

                <p className="mt-2 text-sm text-white/40">
                  Your rotated PDF is ready to
                  download.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left">
                    <p className="text-xs text-white/35">
                      Rotation
                    </p>

                    <p className="mt-1 text-lg font-medium text-white/80">
                      {rotation}°
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left">
                    <p className="text-xs text-white/35">
                      Pages rotated
                    </p>

                    <p className="mt-1 text-lg font-medium text-white/80">
                      {resultPages}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left">
                  <p className="text-xs text-white/35">
                    Output size
                  </p>

                  <p className="mt-1 text-lg font-medium text-white/80">
                    {formatFileSize(
                      resultBlob.size,
                    )}
                  </p>
                </div>

                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-medium text-black transition-all hover:bg-white/90"
                  >
                    <Download className="h-4 w-4" />
                    Download rotated PDF
                  </button>

                  <button
                    type="button"
                    onClick={handleRotateAnother}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-6 text-sm font-medium text-white transition-all hover:bg-white/[0.1]"
                  >
                    Rotate another PDF
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