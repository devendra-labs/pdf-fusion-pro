"use client";

import Link from "next/link";
import {
  ArrowLeft,
  FileImage,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";

export default function ImageToPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [createdPdfBlob, setCreatedPdfBlob] = useState<Blob | null>(
    null,
  );

  const addFiles = (selectedFiles: File[]) => {
    const imageFiles = selectedFiles.filter(
      (file) =>
        file.type === "image/jpeg" ||
        file.type === "image/png",
    );

    if (imageFiles.length === 0) {
      setError("Please select valid JPG or PNG image files.");
      return;
    }

    setFiles((currentFiles) => {
      const existingKeys = new Set(
        currentFiles.map(
          (file) =>
            `${file.name}-${file.size}-${file.lastModified}`,
        ),
      );

      const newFiles = imageFiles.filter(
        (file) =>
          !existingKeys.has(
            `${file.name}-${file.size}-${file.lastModified}`,
          ),
      );

      return [...currentFiles, ...newFiles];
    });

    setError("");
    setIsComplete(false);
    setCreatedPdfBlob(null);
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setFiles((currentFiles) =>
      currentFiles.filter(
        (_, index) => index !== indexToRemove,
      ),
    );

    setError("");
    setIsComplete(false);
    setCreatedPdfBlob(null);
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
    setIsComplete(false);
    setCreatedPdfBlob(null);
  };

  const handleCreatePdf = async () => {
  if (files.length === 0) {
    setError("Please select at least one image.");
    return;
  }

  try {
    setIsCreating(true);
    setError("");
    setIsComplete(false);
    setCreatedPdfBlob(null);

    const pdfDoc = await PDFDocument.create();

    // A4 page size in PDF points
    const A4_WIDTH = 595.28;
    const A4_HEIGHT = 841.89;

    for (const file of files) {
      const imageBytes = await file.arrayBuffer();

      let image;

      if (file.type === "image/jpeg") {
        image = await pdfDoc.embedJpg(imageBytes);
      } else if (file.type === "image/png") {
        image = await pdfDoc.embedPng(imageBytes);
      } else {
        continue;
      }

      const imageWidth = image.width;
      const imageHeight = image.height;

      /*
       * Fit the complete image inside the A4 page.
       *
       * - Keeps original aspect ratio
       * - No stretching
       * - No cropping
       * - Image is centered
       * - Every PDF page has the same A4 size
       */
      const scale = Math.min(
        A4_WIDTH / imageWidth,
        A4_HEIGHT / imageHeight,
      );

      const drawWidth = imageWidth * scale;
      const drawHeight = imageHeight * scale;

      const x = (A4_WIDTH - drawWidth) / 2;
      const y = (A4_HEIGHT - drawHeight) / 2;

      const page = pdfDoc.addPage([
        A4_WIDTH,
        A4_HEIGHT,
      ]);

      page.drawImage(image, {
        x,
        y,
        width: drawWidth,
        height: drawHeight,
      });
    }

    const pdfBytes = await pdfDoc.save();

    const outputBuffer = pdfBytes.buffer.slice(
  pdfBytes.byteOffset,
  pdfBytes.byteOffset + pdfBytes.byteLength,
) as ArrayBuffer;

const blob = new Blob([outputBuffer], {
  type: "application/pdf",
});

    setCreatedPdfBlob(blob);
    setIsComplete(true);
  } catch (err) {
    console.error(err);

    setError(
      "Something went wrong while creating the PDF. Please make sure all selected images are valid JPG or PNG files.",
    );
  } finally {
    setIsCreating(false);
  }
};

  const handleDownload = () => {
    if (!createdPdfBlob) return;

    const url = URL.createObjectURL(createdPdfBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "images-to-pdf.pdf";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const handleCreateAnother = () => {
    setFiles([]);
    setError("");
    setIsCreating(false);
    setIsComplete(false);
    setCreatedPdfBlob(null);
  };

  const formatFileSize = (size: number) => {
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / 1024 / 1024).toFixed(2)} MB`;
  };

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
            Image to PDF
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/50 sm:text-lg">
            Convert your images into a single PDF document
            quickly and easily.
          </p>
        </div>

        <div className="mt-12 rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center backdrop-blur-sm sm:p-14">
          {!isComplete && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                <ImageIcon className="h-7 w-7 text-white/70" />
              </div>

              <h2 className="mt-6 text-xl font-medium text-white">
                Upload your images
              </h2>

              <p className="mt-2 text-sm text-white/40">
                Select multiple JPG or PNG images to create one PDF.
              </p>

              <label className="mt-7 inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-white px-5 text-sm font-medium text-black transition-transform hover:scale-[1.02] hover:bg-white/90">
                Choose images

                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  className="hidden"
                  disabled={isCreating}
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
                JPG and PNG files only
              </p>
            </>
          )}

          {files.length > 0 && !isComplete && (
            <div className="mx-auto mt-8 max-w-xl text-left">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-white/70">
                  Selected images ({files.length})
                </p>

                <button
                  type="button"
                  disabled={isCreating}
                  onClick={() => {
                    setFiles([]);
                    setError("");
                    setCreatedPdfBlob(null);
                  }}
                  className="text-xs text-white/40 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${file.size}-${file.lastModified}`}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.05]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-white/80">
                        {file.name}
                      </p>

                      <p className="mt-1 text-xs text-white/30">
                        {formatFileSize(file.size)}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleMoveFile(index, index - 1)
                        }
                        disabled={
                          index === 0 || isCreating
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                        aria-label={`Move ${file.name} up`}
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleMoveFile(index, index + 1)
                        }
                        disabled={
                          index === files.length - 1 ||
                          isCreating
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                        aria-label={`Move ${file.name} down`}
                      >
                        ↓
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveFile(index)
                        }
                        disabled={isCreating}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={handleCreatePdf}
                  disabled={files.length === 0 || isCreating}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-medium text-black transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FileImage className="h-4 w-4" />

                  {isCreating
                    ? "Creating PDF..."
                    : "Create PDF"}
                </button>
              </div>
            </div>
          )}

          {isComplete && (
            <div className="mx-auto max-w-xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-2xl">
                ✓
              </div>

              <h2 className="mt-6 text-2xl font-semibold text-white">
                PDF created successfully
              </h2>

              <p className="mt-2 text-sm text-white/40">
                {files.length}{" "}
                {files.length === 1 ? "image was" : "images were"}{" "}
                converted into one PDF document.
              </p>

              {createdPdfBlob && (
                <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4">
                  <p className="text-xs text-white/35">
                    PDF size
                  </p>

                  <p className="mt-1 text-lg font-medium text-white/80">
                    {formatFileSize(createdPdfBlob.size)}
                  </p>
                </div>
              )}

              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-sm font-medium text-black transition-all hover:bg-white/90"
                >
                  Download PDF
                </button>

                <button
                  type="button"
                  onClick={handleCreateAnother}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-6 text-sm font-medium text-white transition-all hover:bg-white/[0.1]"
                >
                  Create another PDF
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