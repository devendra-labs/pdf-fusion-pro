"use client";

import Link from "next/link";
import { ArrowLeft, FileUp, X } from "lucide-react";
import { useState } from "react";

type CompressionLevel =
  | "recommended"
  | "maximum"
  | "high-quality";

export default function CompressPage() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [compressionLevel, setCompressionLevel] =
    useState<CompressionLevel>("recommended");

  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] =
    useState(false);

  const [compressedBlob, setCompressedBlob] =
    useState<Blob | null>(null);

  const [compressedSize, setCompressedSize] =
    useState<number | null>(null);

  const [isComplete, setIsComplete] = useState(false);

  const handleFile = (selectedFile: File | null) => {
    if (!selectedFile) {
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      setError("Please select a valid PDF file.");
      return;
    }

    setFile(selectedFile);
    setError("");
    setCompressedBlob(null);
    setCompressedSize(null);
    setIsComplete(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();

    setIsDragging(false);

    const droppedFile =
      event.dataTransfer.files?.[0] ?? null;

    handleFile(droppedFile);
  };

  const handleRemoveFile = () => {
    if (isCompressing) {
      return;
    }

    setFile(null);
    setError("");
    setCompressedBlob(null);
    setCompressedSize(null);
    setIsComplete(false);
  };

  const handleCompressAnother = () => {
    if (isCompressing) {
      return;
    }

    setFile(null);
    setError("");
    setCompressedBlob(null);
    setCompressedSize(null);
    setIsComplete(false);
    setCompressionLevel("recommended");
  };

  const getCompressionDescription = () => {
    switch (compressionLevel) {
      case "maximum":
        return "Stronger structural optimization for a smaller file.";

      case "high-quality":
        return "Lighter optimization with less structural rewriting.";

      default:
        return "Balanced optimization for everyday PDF files.";
    }
  };

  const handleCompress = async () => {
    if (!file) {
      setError("Please select a PDF file first.");
      return;
    }

    try {
      setIsCompressing(true);
      setError("");
      setCompressedBlob(null);
      setCompressedSize(null);
      setIsComplete(false);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/compress", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let message =
          "Something went wrong while compressing the PDF.";

        try {
          const data = await response.json();

          if (data?.error) {
            message = data.error;

            if (data?.details) {
              console.error(
                "[QPDF]",
                data.details,
              );
            }
          }
        } catch {
          // Ignore JSON parsing errors.
        }

        throw new Error(message);
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error(
          "The compressed PDF is empty.",
        );
      }

      setCompressedBlob(blob);
      setCompressedSize(blob.size);
      setIsComplete(true);
    } catch (err) {
      console.error(
        "[browser] PDF compression error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while compressing the PDF.",
      );
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!compressedBlob || !file) {
      return;
    }

    const url =
      URL.createObjectURL(compressedBlob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download = file.name.replace(
      /\.pdf$/i,
      "-compressed.pdf",
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

    return `${(size / 1024 / 1024).toFixed(2)} MB`;
  };

  const compressionPercentage =
    file &&
    compressedSize !== null &&
    file.size > 0
      ? Math.max(
          0,
          ((file.size - compressedSize) /
            file.size) *
            100,
        )
      : 0;

  const isSmaller =
    file &&
    compressedSize !== null &&
    compressedSize < file.size;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <div className="mt-16 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-white/40">
            PDF Tool
          </p>

          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Compress PDF
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/50 sm:text-lg">
            Reduce PDF file size while keeping
            your document easy to use.
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
                  accept="application/pdf"
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
                      Original size:{" "}
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    disabled={isCompressing}
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
                  accept="application/pdf"
                  className="hidden"
                  disabled={isCompressing}
                  onChange={(event) => {
                    handleFile(
                      event.target.files?.[0] ??
                        null,
                    );

                    event.target.value = "";
                  }}
                />
              </label>

              <div className="mx-auto mt-7 max-w-xl text-left">
                <p className="mb-3 text-sm font-medium text-white/70">
                  Compression level
                </p>

                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 transition-colors hover:bg-white/[0.07]">
                    <input
                      type="radio"
                      name="compression-level"
                      value="recommended"
                      checked={
                        compressionLevel ===
                        "recommended"
                      }
                      onChange={() =>
                        setCompressionLevel(
                          "recommended",
                        )
                      }
                      disabled={isCompressing}
                      className="h-4 w-4 accent-white"
                    />

                    <div>
                      <p className="text-sm font-medium text-white/80">
                        Recommended
                      </p>

                      <p className="mt-1 text-xs text-white/35">
                        Balanced file size and
                        quality.
                      </p>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 transition-colors hover:bg-white/[0.07]">
                    <input
                      type="radio"
                      name="compression-level"
                      value="maximum"
                      checked={
                        compressionLevel ===
                        "maximum"
                      }
                      onChange={() =>
                        setCompressionLevel(
                          "maximum",
                        )
                      }
                      disabled={isCompressing}
                      className="h-4 w-4 accent-white"
                    />

                    <div>
                      <p className="text-sm font-medium text-white/80">
                        Maximum compression
                      </p>

                      <p className="mt-1 text-xs text-white/35">
                        Stronger optimization for
                        smaller files.
                      </p>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 transition-colors hover:bg-white/[0.07]">
                    <input
                      type="radio"
                      name="compression-level"
                      value="high-quality"
                      checked={
                        compressionLevel ===
                        "high-quality"
                      }
                      onChange={() =>
                        setCompressionLevel(
                          "high-quality",
                        )
                      }
                      disabled={isCompressing}
                      className="h-4 w-4 accent-white"
                    />

                    <div>
                      <p className="text-sm font-medium text-white/80">
                        High quality
                      </p>

                      <p className="mt-1 text-xs text-white/35">
                        Lighter optimization to
                        preserve more quality.
                      </p>
                    </div>
                  </label>
                </div>

                <p className="mt-3 text-xs text-white/30">
                  {getCompressionDescription()}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCompress}
                disabled={isCompressing}
                className="mt-7 inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-sm font-medium text-black transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isCompressing
                  ? "Compressing PDF..."
                  : "Compress PDF"}
              </button>
            </>
          )}

          {isComplete &&
            file &&
            compressedSize !== null && (
              <div className="mx-auto max-w-xl">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-2xl">
                  ✓
                </div>

                <h2 className="mt-6 text-2xl font-semibold text-white">
                  Compression complete
                </h2>

                <p className="mt-2 text-sm text-white/40">
                  Your compressed PDF is ready
                  to download.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left">
                    <p className="text-xs text-white/35">
                      Original size
                    </p>

                    <p className="mt-1 text-lg font-medium text-white/80">
                      {formatFileSize(
                        file.size,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left">
                    <p className="text-xs text-white/35">
                      Compressed size
                    </p>

                    <p className="mt-1 text-lg font-medium text-white/80">
                      {formatFileSize(
                        compressedSize,
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  {isSmaller ? (
                    <p className="text-sm text-white/60">
                      File size reduced by{" "}
                      <span className="font-medium text-white">
                        {compressionPercentage.toFixed(
                          1,
                        )}
                        %
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-white/40">
                      This PDF was already highly
                      optimized, so the resulting
                      file is not smaller.
                    </p>
                  )}
                </div>

                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-sm font-medium text-black transition-all hover:bg-white/90"
                  >
                    Download compressed PDF
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleCompressAnother
                    }
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-6 text-sm font-medium text-white transition-all hover:bg-white/[0.1]"
                  >
                    Compress another PDF
                  </button>
                </div>
              </div>
            )}

          {error && (
            <p className="mx-auto mt-4 max-w-md text-sm text-red-400">
              {error}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}