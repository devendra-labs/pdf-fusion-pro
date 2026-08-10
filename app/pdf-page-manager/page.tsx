"use client";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileText,
  FileUp,
  GripVertical,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PDFPageProxy } from "pdfjs-dist/types/src/display/api";

type PageItem = {
  id: string;
  originalIndex: number;
  pageNumber: number;
  thumbnail: string;
};

type SortablePageProps = {
  page: PageItem;
  index: number;
  onRemove: (id: string) => void;
};

function SortablePage({
  page,
  index,
  onRemove,
}: SortablePageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: page.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group overflow-hidden rounded-2xl border bg-black/30 transition ${
        isDragging
          ? "border-white/40 shadow-2xl"
          : "border-white/10"
      }`}
    >
      <div className="relative">
        <div className="absolute left-3 top-3 z-10 rounded-lg bg-black/70 px-2 py-1 text-xs text-white/70 backdrop-blur">
          Page {index + 1}
        </div>

        <button
          type="button"
          onClick={() => onRemove(page.id)}
          className="absolute right-3 top-3 z-10 rounded-lg bg-black/70 p-2 text-white/60 backdrop-blur transition hover:bg-red-500/20 hover:text-red-300"
          title="Remove page"
        >
          <Trash2 size={16} />
        </button>

        <div className="relative aspect-[3/4] bg-white/5">
          <Image
  src={page.thumbnail}
  alt={`PDF page ${page.pageNumber}`}
  fill
  unoptimized
  className="object-contain"
/>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 p-3">
        <div className="flex min-w-0 items-center gap-2">
          <FileText
            size={16}
            className="shrink-0 text-white/50"
          />

          <span className="truncate text-sm text-white/70">
            Original page {page.originalIndex + 1}
          </span>
        </div>

        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white active:cursor-grabbing"
          title="Drag to reorder"
        >
          <GripVertical size={18} />
        </button>
      </div>
    </div>
  );
}

export default function PdfPageManagerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const createThumbnail = async (
    page: PDFPageProxy,
  ): Promise<string> => {
    const viewport = page.getViewport({
      scale: 0.45,
    });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error(
        "Unable to create page preview.",
      );
    }

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    await page.render({
      canvas,
      canvasContext: context,
      viewport,
    }).promise;

    return canvas.toDataURL("image/jpeg", 0.8);
  };

  const handleFile = async (
    selectedFile: File | null,
  ) => {
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setError("Please select a valid PDF file.");
      return;
    }

    setIsLoading(true);
    setError("");
    setPages([]);

    try {
      const pdfjsLib = await import("pdfjs-dist");

      pdfjsLib.GlobalWorkerOptions.workerSrc =
        `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer =
        await selectedFile.arrayBuffer();

      const pdf = await pdfjsLib
        .getDocument({
          data: new Uint8Array(arrayBuffer),
        })
        .promise;

      const loadedPages: PageItem[] = [];

      for (
        let pageNumber = 1;
        pageNumber <= pdf.numPages;
        pageNumber++
      ) {
        const pdfPage = await pdf.getPage(
          pageNumber,
        );

        const thumbnail =
          await createThumbnail(pdfPage);

        loadedPages.push({
          id: `page-${pageNumber}-${Date.now()}`,
          originalIndex: pageNumber - 1,
          pageNumber,
          thumbnail,
        });
      }

      setFile(selectedFile);
      setPages(loadedPages);
    } catch (err) {
      console.error(
        "[PDF Page Manager] Error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load this PDF.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = (
    event: DragEndEvent,
  ) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setPages((currentPages) => {
      const oldIndex = currentPages.findIndex(
        (page) => page.id === active.id,
      );

      const newIndex = currentPages.findIndex(
        (page) => page.id === over.id,
      );

      if (
        oldIndex === -1 ||
        newIndex === -1
      ) {
        return currentPages;
      }

      return arrayMove(
        currentPages,
        oldIndex,
        newIndex,
      );
    });
  };

  const removePage = (id: string) => {
    setPages((currentPages) =>
      currentPages.filter(
        (page) => page.id !== id,
      ),
    );
  };

  const resetPages = async () => {
    if (!file) return;

    await handleFile(file);
  };

  const removeFile = () => {
    setFile(null);
    setPages([]);
    setError("");
  };

  const savePdf = async () => {
    if (!file) {
      setError("Please select a PDF first.");
      return;
    }

    if (pages.length === 0) {
      setError(
        "At least one page must remain.",
      );
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const sourceBytes =
        await file.arrayBuffer();

      const sourcePdf =
        await PDFDocument.load(sourceBytes);

      const outputPdf =
        await PDFDocument.create();

      const pageIndices = pages.map(
        (page) => page.originalIndex,
      );

      const copiedPages =
        await outputPdf.copyPages(
          sourcePdf,
          pageIndices,
        );

      copiedPages.forEach((page) => {
        outputPdf.addPage(page);
      });

      const outputBytes =
        await outputPdf.save();

      const safeBuffer = new Uint8Array(
        outputBytes,
      ).buffer;

      const blob = new Blob(
        [safeBuffer],
        {
          type: "application/pdf",
        },
      );

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;
      link.download = file.name.replace(
        /\.pdf$/i,
        "-managed.pdf",
      );

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        "[PDF Page Manager] Save error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create the managed PDF.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <div className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-white/10 p-3">
              <FileText size={28} />
            </div>

            <div>
              <h1 className="text-3xl font-bold">
                PDF Page Manager
              </h1>

              <p className="text-white/60">
                Reorder, remove, and manage PDF
                pages easily.
              </p>
            </div>
          </div>
        </div>

        {!file && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <label className="flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] transition hover:border-white/30 hover:bg-white/[0.04]">
              <FileUp
                size={42}
                className="mb-4 text-white/60"
              />

              <h2 className="mb-2 text-xl font-semibold">
                Upload your PDF
              </h2>

              <p className="mb-5 text-sm text-white/50">
                Choose a PDF to manage its pages
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

        {isLoading && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center text-white/60">
            Loading PDF pages...
          </div>
        )}

        {file && !isLoading && (
          <>
            <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <FileText
                  size={24}
                  className="shrink-0 text-white/60"
                />

                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {file.name}
                  </p>

                  <p className="text-sm text-white/50">
                    {pages.length} page
                    {pages.length !== 1
                      ? "s"
                      : ""} remaining
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={resetPages}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium transition hover:bg-white/10"
                >
                  <RotateCcw size={16} />
                  Reset
                </button>

                <button
                  type="button"
                  onClick={removeFile}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium transition hover:bg-white/10"
                >
                  <X size={16} />
                  Remove PDF
                </button>
              </div>
            </div>

            {pages.length === 0 ? (
              <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-8 text-center text-red-300">
                All pages have been removed.

                <button
                  type="button"
                  onClick={resetPages}
                  className="ml-2 underline"
                >
                  Restore pages
                </button>
              </div>
            ) : (
              <>
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">
                      Manage Pages
                    </h2>

                    <p className="text-sm text-white/50">
                      Drag pages to reorder them.
                      Use the trash icon to remove
                      pages.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={savePdf}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Download size={18} />

                    {isSaving
                      ? "Creating PDF..."
                      : "Download Managed PDF"}
                  </button>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={pages.map(
                      (page) => page.id,
                    )}
                    strategy={
                      verticalListSortingStrategy
                    }
                  >
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {pages.map(
                        (page, index) => (
                          <SortablePage
                            key={page.id}
                            page={page}
                            index={index}
                            onRemove={
                              removePage
                            }
                          />
                        ),
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </>
            )}
          </>
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