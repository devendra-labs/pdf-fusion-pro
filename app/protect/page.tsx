"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  FileLock2,
  FileUp,
  X,
} from "lucide-react";
import { useState } from "react";

export default function ProtectPage() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProtecting, setIsProtecting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const [protectedBlob, setProtectedBlob] =
    useState<Blob | null>(null);

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
    setProtectedBlob(null);
    setIsComplete(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const droppedFile =
      event.dataTransfer.files?.[0] ?? null;

    handleFile(droppedFile);
  };

  const handleRemoveFile = () => {
    if (isProtecting) return;

    setFile(null);
    setPassword("");
    setConfirmPassword("");
    setError("");
    setProtectedBlob(null);
    setIsComplete(false);
  };

  const handleProtectAnother = () => {
    setFile(null);
    setPassword("");
    setConfirmPassword("");
    setError("");
    setProtectedBlob(null);
    setIsComplete(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const validateForm = () => {
    if (!file) {
      setError("Please select a PDF file first.");
      return false;
    }

    if (!password) {
      setError("Please enter a password.");
      return false;
    }

    if (password.length < 4) {
      setError("Password must contain at least 4 characters.");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }

    return true;
  };

  const handleProtect = async () => {
    if (!validateForm()) return;

    try {
      setIsProtecting(true);
      setError("");
      setProtectedBlob(null);
      setIsComplete(false);

      const formData = new FormData();

      formData.append("file", file as File);
      formData.append("password", password);

      const response = await fetch("/api/protect", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let message =
          "Something went wrong while protecting the PDF.";

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
          "The server returned an empty PDF.",
        );
      }

      setProtectedBlob(blob);
      setIsComplete(true);
    } catch (error) {
      console.error("Protect PDF error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while protecting the PDF.",
      );
    } finally {
      setIsProtecting(false);
    }
  };

  const handleDownload = () => {
    if (!protectedBlob || !file) return;

    const url = URL.createObjectURL(protectedBlob);

    const link = document.createElement("a");

    link.href = url;
    link.download = file.name.replace(
      /\.pdf$/i,
      "-protected.pdf",
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

  const passwordStrength =
    password.length === 0
      ? ""
      : password.length < 6
        ? "Weak"
        : password.length < 10
          ? "Medium"
          : "Strong";

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-5xl px-6 pb-20">
        <div className="pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>

        <div className="mt-16 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-white/40">
            PDF Tool
          </p>

          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Protect PDF
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/50 sm:text-lg">
            Protect your PDF with a password and keep your
            document secure.
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
                <FileLock2 className="h-7 w-7 text-white/70" />
              </div>

              <h2 className="mt-6 text-xl font-medium text-white">
                {isDragging
                  ? "Drop your PDF here"
                  : "Upload your PDF"}
              </h2>

              <p className="mt-2 text-sm text-white/40">
                Drag and drop a PDF here or choose a file
                from your computer.
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

          {file && !isComplete && (
            <>
              <div className="mx-auto max-w-xl rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white/80">
                      {file.name}
                    </p>

                    <p className="mt-1 text-xs text-white/30">
                      File size: {formatFileSize(file.size)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    disabled={isProtecting}
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
                  disabled={isProtecting}
                  onChange={(event) => {
                    handleFile(
                      event.target.files?.[0] ?? null,
                    );

                    event.target.value = "";
                  }}
                />
              </label>

              <div className="mx-auto mt-7 max-w-xl text-left">
                <p className="mb-3 text-sm font-medium text-white/70">
                  Set PDF password
                </p>

                <div className="space-y-3">
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
                        setError("");
                      }}
                      disabled={isProtecting}
                      placeholder="Enter password"
                      autoComplete="new-password"
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 pr-12 text-sm text-white outline-none placeholder:text-white/25 transition-colors focus:border-white/25 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (value) => !value,
                        )
                      }
                      disabled={isProtecting}
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

                  <div className="relative">
                    <input
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(
                          event.target.value,
                        );
                        setError("");
                      }}
                      disabled={isProtecting}
                      placeholder="Confirm password"
                      autoComplete="new-password"
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 pr-12 text-sm text-white outline-none placeholder:text-white/25 transition-colors focus:border-white/25 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (value) => !value,
                        )
                      }
                      disabled={isProtecting}
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-white/35 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
                      aria-label={
                        showConfirmPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-white/30">
                    Minimum 4 characters
                  </p>

                  {passwordStrength && (
                    <p
                      className={`text-xs ${
                        passwordStrength === "Strong"
                          ? "text-emerald-400/70"
                          : passwordStrength ===
                              "Medium"
                            ? "text-yellow-400/70"
                            : "text-red-400/70"
                      }`}
                    >
                      {passwordStrength}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleProtect}
                disabled={isProtecting}
                className="mt-7 inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-sm font-medium text-black transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isProtecting
                  ? "Protecting PDF..."
                  : "Protect PDF"}
              </button>
            </>
          )}

          {isComplete && file && protectedBlob && (
            <div className="mx-auto max-w-xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                <FileLock2 className="h-7 w-7 text-white/70" />
              </div>

              <h2 className="mt-6 text-2xl font-semibold text-white">
                PDF protected successfully
              </h2>

              <p className="mt-2 text-sm text-white/40">
                Your password-protected PDF is ready to
                download.
              </p>

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
                    Protected size
                  </p>

                  <p className="mt-1 text-lg font-medium text-white/80">
                    {formatFileSize(protectedBlob.size)}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <p className="text-sm text-white/50">
                  🔒 Your PDF is protected with a password.
                </p>
              </div>

              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-sm font-medium text-black transition-all hover:bg-white/90"
                >
                  Download protected PDF
                </button>

                <button
                  type="button"
                  onClick={handleProtectAnother}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-6 text-sm font-medium text-white transition-all hover:bg-white/[0.1]"
                >
                  Protect another PDF
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

        <div className="mx-auto mt-8 max-w-2xl text-center">
          <p className="text-xs leading-6 text-white/25">
            Your PDF is processed through the server only when
            you choose to protect it. Keep your password safe
            because it is required to open the protected
            document.
          </p>
        </div>
      </div>
    </main>
  );
}