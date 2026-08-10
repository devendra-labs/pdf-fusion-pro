"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  FileKey2,
  FileUp,
  X,
} from "lucide-react";
import { useState } from "react";

type UnlockStatus = "idle" | "unlocking" | "success" | "error";

export default function UnlockPage() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [status, setStatus] =
    useState<UnlockStatus>("idle");

  const [isDragging, setIsDragging] = useState(false);

  const [unlockedBlob, setUnlockedBlob] =
    useState<Blob | null>(null);

  const isUnlocking = status === "unlocking";
  const isComplete = status === "success";

  

  const handleFile = (selectedFile: File | null) => {
    if (!selectedFile) return;

    if (
      selectedFile.type !== "application/pdf" &&
      !selectedFile.name
        .toLowerCase()
        .endsWith(".pdf")
    ) {
      setError("Please select a valid PDF file.");
      setStatus("error");
      return;
    }

    setFile(selectedFile);
    setPassword("");
    setError("");
    setUnlockedBlob(null);
    setStatus("idle");
    setShowPassword(false);
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
    if (isUnlocking) return;

    setFile(null);
    setPassword("");
    setError("");
    setUnlockedBlob(null);
    setStatus("idle");
    setShowPassword(false);
  };

  const handleUnlockAnother = () => {
    setFile(null);
    setPassword("");
    setError("");
    setUnlockedBlob(null);
    setStatus("idle");
    setShowPassword(false);
  };

  const handleUnlock = async () => {
    /*
     * Always reset the previous error before starting.
     */
    setError("");

    if (!file) {
      setError("Please select a PDF file.");
      setStatus("error");
      return;
    }

    if (!password) {
      setError("Please enter the PDF password.");
      setStatus("error");
      return;
    }

    /*
     * Start loading state.
     */
    setStatus("unlocking");

    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("password", password);

      const response = await fetch("/api/unlock", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let message =
          "Unable to unlock this PDF.";

        try {
          const data = await response.json();

          if (
            data &&
            typeof data.error === "string" &&
            data.error.trim()
          ) {
            message = data.error;
          }
        } catch {
          /*
           * Response was not JSON.
           * Keep the default error message.
           */
        }

        throw new Error(message);
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error(
          "The server returned an empty PDF.",
        );
      }

      /*
       * Success.
       */
      setUnlockedBlob(blob);
      setError("");
      setStatus("success");
    } catch (error) {
      /*
       * IMPORTANT:
       * Immediately change status back to "error".
       *
       * This guarantees that the button changes from
       * "Unlocking PDF..." back to "Unlock PDF".
       */
      const message =
        error instanceof Error
          ? error.message
          : "Unable to unlock this PDF.";

      setUnlockedBlob(null);
      setError(message);
      setStatus("error");
    }
  };

  const handleDownload = () => {
    if (!unlockedBlob || !file) return;

    const url = URL.createObjectURL(unlockedBlob);

    const link = document.createElement("a");

    link.href = url;

    link.download = file.name.replace(
      /\.pdf$/i,
      "-unlocked.pdf",
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

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-5xl px-6 pb-20">
        {/* Back button */}
        <div className="pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>

        {/* Header */}
        <div className="mt-16 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-white/40">
            PDF Tool
          </p>

          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Unlock PDF
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/50 sm:text-lg">
            Remove password protection from your PDF when
            you know the document password.
          </p>
        </div>

        {/* Main tool */}
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
          {/* ================================================== */}
          {/* STEP 1 — NO FILE */}
          {/* ================================================== */}

          {!file && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                <FileKey2 className="h-7 w-7 text-white/70" />
              </div>

              <h2 className="mt-6 text-xl font-medium text-white">
                {isDragging
                  ? "Drop your PDF here"
                  : "Upload your PDF"}
              </h2>

              <p className="mt-2 text-sm text-white/40">
                Drag and drop a password-protected PDF here
                or choose a file from your computer.
              </p>

              <label className="mt-7 inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-white px-5 text-sm font-medium text-black transition-transform hover:scale-[1.02] hover:bg-white/90">
                <FileUp className="mr-2 h-4 w-4" />
                Choose PDF file

                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(event) => {
                    handleFile(
                      event.target.files?.[0] ?? null,
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

          {/* ================================================== */}
          {/* STEP 2 — FILE SELECTED */}
          {/* ================================================== */}

          {file && !isComplete && (
            <>
              {/* File card */}
              <div className="mx-auto max-w-xl rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white/80">
                      {file.name}
                    </p>

                    <p className="mt-1 text-xs text-white/30">
                      File size:{" "}
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    disabled={isUnlocking}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Remove PDF"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Replace button */}
              <label
                className={`mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm text-white/60 transition-colors hover:bg-white/[0.1] hover:text-white ${
                  isUnlocking
                    ? "cursor-not-allowed opacity-40"
                    : "cursor-pointer"
                }`}
              >
                Replace PDF

                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  disabled={isUnlocking}
                  onChange={(event) => {
                    handleFile(
                      event.target.files?.[0] ?? null,
                    );

                    event.target.value = "";
                  }}
                />
              </label>

              {/* Password */}
              <div className="mx-auto mt-7 max-w-xl text-left">
                <p className="mb-3 text-sm font-medium text-white/70">
                  PDF password
                </p>

                <div className="relative">
                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);

                      /*
                       * Clear previous wrong-password
                       * message as soon as the user edits
                       * the password.
                       */
                      if (error) {
                        setError("");
                        setStatus("idle");
                      }
                    }}
                    disabled={isUnlocking}
                    placeholder="Enter PDF password"
                    autoComplete="off"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 pr-12 text-sm text-white outline-none placeholder:text-white/25 transition-colors focus:border-white/25 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value,
                      )
                    }
                    disabled={isUnlocking}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-white/35 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <p className="mt-3 text-xs text-white/30">
                  Enter the password used to protect this
                  PDF.
                </p>
              </div>

              {/* Unlock button */}
              <button
                type="button"
                onClick={handleUnlock}
                disabled={isUnlocking}
                className="mt-7 inline-flex h-11 min-w-[150px] items-center justify-center rounded-xl bg-white px-6 text-sm font-medium text-black transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isUnlocking
                  ? "Unlocking PDF..."
                  : "Unlock PDF"}
              </button>

              {/* Error */}
              {error && (
                <div className="mx-auto mt-5 max-w-xl rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
                  <p className="text-sm text-red-400">
                    {error}
                  </p>
                </div>
              )}
            </>
          )}

          {/* ================================================== */}
          {/* STEP 3 — SUCCESS */}
          {/* ================================================== */}

          {isComplete &&
            file &&
            unlockedBlob && (
              <div className="mx-auto max-w-xl">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                  <FileKey2 className="h-7 w-7 text-white/70" />
                </div>

                <h2 className="mt-6 text-2xl font-semibold text-white">
                  PDF unlocked successfully
                </h2>

                <p className="mt-2 text-sm text-white/40">
                  Your unlocked PDF is ready to download.
                </p>

                {/* File sizes */}
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left">
                    <p className="text-xs text-white/35">
                      Original size
                    </p>

                    <p className="mt-1 text-lg font-medium text-white/80">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left">
                    <p className="text-xs text-white/35">
                      Unlocked size
                    </p>

                    <p className="mt-1 text-lg font-medium text-white/80">
                      {formatFileSize(
                        unlockedBlob.size,
                      )}
                    </p>
                  </div>
                </div>

                {/* Success message */}
                <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-sm text-white/50">
                    🔓 Password protection has been removed
                    from your PDF.
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-sm font-medium text-black transition-all hover:bg-white/90"
                  >
                    Download unlocked PDF
                  </button>

                  <button
                    type="button"
                    onClick={handleUnlockAnother}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-6 text-sm font-medium text-white transition-all hover:bg-white/[0.1]"
                  >
                    Unlock another PDF
                  </button>
                </div>
              </div>
            )}
        </div>

        {/* Bottom note */}
        <div className="mx-auto mt-8 max-w-2xl text-center">
          <p className="text-xs leading-6 text-white/25">
            You must know the PDF password to unlock the
            document. This tool does not attempt to bypass
            unknown passwords.
          </p>
        </div>
      </div>
    </main>
  );
}