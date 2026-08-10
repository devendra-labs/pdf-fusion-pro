"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileText,
  FileUp,
  X,
} from "lucide-react";
import { useState } from "react";

export default function PdfToWordPage() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(
    null,
  );
  const [outputName, setOutputName] = useState("");

  const handleFile = (selectedFile: File | null) => {
    if (!selectedFile) {
      return;
    }

    if (
      selectedFile.type !== "application/pdf" &&
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please select a valid PDF file.");
      return;
    }

    setFile(selectedFile);
    setError("");
    setIsComplete(false);

    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }

    setOutputName("");
  };

  const removeFile = () => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }

    setFile(null);
    setError("");
    setIsComplete(false);
    setDownloadUrl(null);
    setOutputName("");
  };

  const convertToWord = async () => {
    if (!file) {
      setError("Please select a PDF file first.");
      return;
    }

    setIsConverting(true);
    setError("");
    setIsComplete(false);

    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "/api/pdf-to-word",
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        let message = "PDF to Word conversion failed.";

        try {
          const data = await response.json();

          if (data?.error) {
            message = data.error;
          }
        } catch {
          // Ignore JSON parsing errors.
        }

        throw new Error(message);
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error(
          "The converted Word file is empty.",
        );
      }

      const url = URL.createObjectURL(blob);

      const nameWithoutExtension =
        file.name.replace(/\.pdf$/i, "");

      setDownloadUrl(url);
      setOutputName(
        `${nameWithoutExtension}.docx`,
      );
      setIsComplete(true);
    } catch (err) {
      console.error(
        "[PDF to Word] Conversion error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to convert the PDF to Word.",
      );
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
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
              <FileText size={28} />
            </div>

            <div>
              <h1 className="text-3xl font-bold">
                PDF to Word
              </h1>

              <p className="text-white/60">
                Convert PDF files into editable Word
                documents.
              </p>
            </div>
          </div>
        </div>

        {!file && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <label className="flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] transition hover:border-white/30 hover:bg-white/[0.04]">
              <FileUp
                size={44}
                className="mb-4 text-white/60"
              />

              <h2 className="mb-2 text-xl font-semibold">
                Upload your PDF
              </h2>

              <p className="mb-5 text-center text-sm text-white/50">
                Select a PDF and convert it into a
                Word document.
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
                    event.target.files?.[0] ??
                      null,
                  )
                }
              />
            </label>
          </div>
        )}

        {file && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="rounded-xl bg-white/10 p-3">
                  <FileText
                    size={22}
                    className="text-white/70"
                  />
                </div>

                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {file.name}
                  </p>

                  <p className="text-sm text-white/50">
                    {(file.size / 1024 / 1024).toFixed(
                      2,
                    )}{" "}
                    MB
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={removeFile}
                disabled={isConverting}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={16} />
                Remove PDF
              </button>
            </div>

            {!isComplete && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold">
                    Convert PDF to Word
                  </h2>

                  <p className="mt-2 text-sm text-white/50">
                    Your PDF will be processed by the
                    application and returned as a
                    downloadable Word document.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={convertToWord}
                  disabled={isConverting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  <FileText size={18} />

                  {isConverting
                    ? "Converting..."
                    : "Convert to Word"}
                </button>
              </div>
            )}

            {isComplete && downloadUrl && (
              <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6">
                <div className="mb-5">
                  <h2 className="text-xl font-semibold text-emerald-300">
                    Conversion Complete
                  </h2>

                  <p className="mt-2 text-sm text-white/60">
                    Your Word document is ready.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <a
                    href={downloadUrl}
                    download={outputName}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
                  >
                    <Download size={18} />
                    Download Word File
                  </a>

                  <button
                    type="button"
                    onClick={removeFile}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium transition hover:bg-white/10"
                  >
                    <X size={18} />
                    Convert Another PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}