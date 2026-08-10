"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileUp } from "lucide-react";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";

export default function MergePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [mergedPdfUrl, setMergedPdfUrl] = useState("");

  const handleMerge = async () => {
    if (files.length < 2) {
      setError("Please select at least 2 PDF files to merge.");
      return;
    }

    try {
      setIsMerging(true);
      setError("");

      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const fileBytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(fileBytes);

        const pages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices(),
        );

        pages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      }

      const mergedPdfBytes = await mergedPdf.save();

      const outputBuffer = mergedPdfBytes.buffer.slice(
  mergedPdfBytes.byteOffset,
  mergedPdfBytes.byteOffset + mergedPdfBytes.byteLength,
) as ArrayBuffer;

const blob = new Blob([outputBuffer], {
  type: "application/pdf",
});

      const url = URL.createObjectURL(blob);

      setMergedPdfUrl(url);
    } catch (err) {
      console.error(err);

      setError(
        "Something went wrong while merging the PDFs. Please check that all selected files are valid PDF documents.",
      );
    } finally {
      setIsMerging(false);
    }
  };

  const addFiles = (selectedFiles: File[]) => {
    const pdfFiles = selectedFiles.filter(
      (file) => file.type === "application/pdf",
    );

    setFiles((currentFiles) => {
      const existingKeys = new Set(
        currentFiles.map(
          (file) =>
            `${file.name}-${file.size}-${file.lastModified}`,
        ),
      );

      const newFiles = pdfFiles.filter(
        (file) =>
          !existingKeys.has(
            `${file.name}-${file.size}-${file.lastModified}`,
          ),
      );

      return [...currentFiles, ...newFiles];
    });

    setError("");
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setFiles((currentFiles) =>
      currentFiles.filter((_, index) => index !== indexToRemove),
    );

    setError("");
  };

  const handleMoveFile = (
    fromIndex: number,
    toIndex: number,
  ) => {
    setFiles((currentFiles) => {
      const updatedFiles = [...currentFiles];

      const [movedFile] = updatedFiles.splice(fromIndex, 1);

      updatedFiles.splice(toIndex, 0, movedFile);

      return updatedFiles;
    });

    setError("");
  };

  const handleReset = () => {
    if (mergedPdfUrl) {
      URL.revokeObjectURL(mergedPdfUrl);
    }

    setMergedPdfUrl("");
    setFiles([]);
    setError("");
  };

  if (mergedPdfUrl) {
    return (
      <main className="min-h-screen bg-black px-6 py-12 text-white">
        <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center">
          <div className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center backdrop-blur-sm sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
              <CheckCircle2 className="h-8 w-8 text-white/80" />
            </div>

            <p className="mt-6 text-sm font-medium uppercase tracking-[0.2em] text-white/40">
              PDF Tool
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              PDFs merged successfully
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/50 sm:text-base">
              Your {files.length} PDF files have been combined into one
              document.
            </p>

            <div className="mx-auto mt-8 max-w-md rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-left">
              <p className="text-sm font-medium text-white/80">
                merged.pdf
              </p>

              <p className="mt-1 text-xs text-white/30">
                {files.length} PDF files
              </p>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={mergedPdfUrl}
                download="merged.pdf"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-sm font-medium text-black transition-all hover:scale-[1.02] hover:bg-white/90"
              >
                Download PDF
              </a>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] px-6 text-sm font-medium text-white transition-colors hover:bg-white/[0.1]"
              >
                Merge another
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-6 py-8 sm:py-12">
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
            Merge PDF
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/50 sm:text-lg">
            Combine multiple PDF files into one document quickly and easily.
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
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);

            const droppedFiles = Array.from(event.dataTransfer.files);
            addFiles(droppedFiles);
          }}
          className={`mt-12 rounded-3xl border border-dashed p-8 text-center backdrop-blur-sm transition-all sm:p-14 ${
            isDragging
              ? "scale-[1.01] border-white/40 bg-white/[0.08]"
              : "border-white/15 bg-white/[0.03]"
          }`}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
            <FileUp className="h-7 w-7 text-white/70" />
          </div>

          <h2 className="mt-6 text-xl font-medium text-white">
            Drop your PDF files here
          </h2>

          <p className="mt-2 text-sm text-white/40">
            Upload multiple PDF files to merge them into one document.
          </p>

          <label className="mt-7 inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-white px-5 text-sm font-medium text-black transition-transform hover:scale-[1.02] hover:bg-white/90">
            Choose PDF files

            <input
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={(event) => {
                const selectedFiles = Array.from(
                  event.target.files ?? [],
                );

                addFiles(selectedFiles);

                event.target.value = "";
              }}
            />
          </label>

          <p className="mt-4 text-xs text-white/25">
            PDF files only
          </p>

          {files.length > 0 && (
            <div className="mx-auto mt-8 max-w-xl text-left">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-white/70">
                  Selected files ({files.length})
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setFiles([]);
                    setError("");
                  }}
                  className="text-xs text-white/40 transition-colors hover:text-white"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${file.lastModified}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white/80">
                        {file.name}
                      </p>

                      <p className="mt-1 text-xs text-white/30">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>

                    <div className="ml-4 flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleMoveFile(index, index - 1)
                        }
                        disabled={index === 0}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                        aria-label={`Move ${file.name} up`}
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleMoveFile(index, index + 1)
                        }
                        disabled={index === files.length - 1}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                        aria-label={`Move ${file.name} down`}
                      >
                        ↓
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label={`Remove ${file.name}`}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {files.length === 1 && (
            <p className="mt-5 text-sm text-white/40">
              Select at least 2 PDF files to merge.
            </p>
          )}

          {files.length > 0 && (
            <button
              type="button"
              onClick={handleMerge}
              disabled={isMerging || files.length < 2}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-medium text-black transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isMerging
                ? "Merging PDFs..."
                : `Merge ${files.length} PDFs`}
            </button>
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