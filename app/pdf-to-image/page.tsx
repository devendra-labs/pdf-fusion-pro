"use client";

import Link from "next/link";
import { ArrowLeft, Download, FileImage, FileUp, X } from "lucide-react";
import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type ImageFormat = "png" | "jpeg";

export default function PdfToImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<ImageFormat>("png");
  const [quality, setQuality] = useState(0.92);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<
    { name: string; blob: Blob; url: string }[]
  >([]);

  const handleFile = (selectedFile: File | null) => {
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setError("Please select a valid PDF file.");
      return;
    }

    setFile(selectedFile);
    setError("");
    setImages([]);
  };

  const removeFile = () => {
    images.forEach((image) => URL.revokeObjectURL(image.url));
    setFile(null);
    setImages([]);
    setError("");
  };

  const convertPdfToImages = async () => {
    if (!file) {
      setError("Please select a PDF file first.");
      return;
    }

    setIsConverting(true);
    setError("");

    images.forEach((image) => URL.revokeObjectURL(image.url));
    setImages([]);

    try {
      const arrayBuffer = await file.arrayBuffer();

      const pdf = await pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
      }).promise;

      const convertedImages: {
        name: string;
        blob: Blob;
        url: string;
      }[] = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);

        const viewport = page.getViewport({
          scale: 2,
        });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Unable to create canvas.");
        }

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        await page.render({
          canvas,
          canvasContext: context,
          viewport,
        }).promise;

        const mimeType =
          format === "png" ? "image/png" : "image/jpeg";

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (result) => {
              if (result) {
                resolve(result);
              } else {
                reject(new Error("Failed to create image."));
              }
            },
            mimeType,
            format === "jpeg" ? quality : undefined,
          );
        });

        convertedImages.push({
          name: `${file.name.replace(/\.pdf$/i, "")}-page-${pageNumber}.${format}`,
          blob,
          url: URL.createObjectURL(blob),
        });
      }

      setImages(convertedImages);
    } catch (err) {
      console.error("[PDF to Image] Error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to convert this PDF to images.",
      );
    } finally {
      setIsConverting(false);
    }
  };

  const downloadImage = (
    blob: Blob,
    name: string,
  ) => {
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  const downloadAll = async () => {
    for (const image of images) {
      downloadImage(image.blob, image.name);

      await new Promise((resolve) =>
        setTimeout(resolve, 150),
      );
    }
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
        >
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        <div className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-white/10 p-3">
              <FileImage size={28} />
            </div>

            <div>
              <h1 className="text-3xl font-bold">
                PDF to Image
              </h1>

              <p className="text-white/60">
                Convert PDF pages into high-quality PNG or JPG images.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
          {!file ? (
            <label className="flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] transition hover:border-white/30 hover:bg-white/[0.04]">
              <FileUp
                size={42}
                className="mb-4 text-white/60"
              />

              <h2 className="mb-2 text-xl font-semibold">
                Upload your PDF
              </h2>

              <p className="mb-5 text-sm text-white/50">
                Click here to choose a PDF file
              </p>

              <span className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black">
                Choose PDF
              </span>

              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(event) =>
                  handleFile(
                    event.target.files?.[0] ?? null,
                  )
                }
              />
            </label>
          ) : (
            <div>
              <div className="mb-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <FileImage
                    size={24}
                    className="shrink-0 text-white/70"
                  />

                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {file.name}
                    </p>

                    <p className="text-sm text-white/50">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={removeFile}
                  className="rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
                  title="Remove PDF"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    Image format
                  </label>

                  <select
                    value={format}
                    onChange={(event) =>
                      setFormat(
                        event.target.value as ImageFormat,
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none"
                  >
                    <option value="png">
                      PNG — Best quality
                    </option>

                    <option value="jpeg">
                      JPG — Smaller size
                    </option>
                  </select>
                </div>

                {format === "jpeg" && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      JPG Quality:{" "}
                      {Math.round(quality * 100)}%
                    </label>

                    <input
                      type="range"
                      min="0.5"
                      max="1"
                      step="0.01"
                      value={quality}
                      onChange={(event) =>
                        setQuality(
                          Number(event.target.value),
                        )
                      }
                      className="mt-3 w-full"
                    />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={convertPdfToImages}
                disabled={isConverting}
                className="mt-6 w-full rounded-xl bg-white px-5 py-3.5 font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isConverting
                  ? "Converting PDF..."
                  : "Convert PDF to Images"}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>

        {images.length > 0 && (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-semibold">
                  Converted Pages
                </h2>

                <p className="mt-1 text-sm text-white/50">
                  {images.length} page
                  {images.length !== 1 ? "s" : ""} converted
                  successfully.
                </p>
              </div>

              <button
                type="button"
                onClick={downloadAll}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                <Download size={18} />
                Download All
              </button>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((image, index) => (
                <div
                  key={image.name}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-black/30"
                >
                  <div className="aspect-[3/4] bg-white/5">
  {/* PDF pages are rendered as blob URLs, so next/image is not suitable here. */}
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img
    src={image.url}
    alt={`PDF page ${index + 1}`}
    className="h-full w-full object-contain"
  />
</div>

                  <div className="p-4">
                    <p className="mb-3 truncate text-sm text-white/70">
                      Page {index + 1}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        downloadImage(
                          image.blob,
                          image.name,
                        )
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium transition hover:bg-white/10"
                    >
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}