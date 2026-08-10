import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const runtime = "nodejs";

const QPDF_PATH = "C:\\Program Files\\qpdf 12.3.2\\bin\\qpdf.exe";

export async function POST(request: Request) {
  let tempDir: string | null = null;

  try {
    const formData = await request.formData();
    const uploadedFile = formData.get("file");

    if (!(uploadedFile instanceof File)) {
      return Response.json(
        {
          error: "No PDF file was uploaded.",
        },
        { status: 400 },
      );
    }

    if (uploadedFile.type !== "application/pdf") {
      return Response.json(
        {
          error: "Only PDF files are supported.",
        },
        { status: 400 },
      );
    }

    const inputBuffer = Buffer.from(
      await uploadedFile.arrayBuffer(),
    );

    if (inputBuffer.length === 0) {
      return Response.json(
        {
          error: "The uploaded PDF is empty.",
        },
        { status: 400 },
      );
    }

    tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "pdf-fusion-"),
    );

    const inputPath = path.join(tempDir, "input.pdf");
    const outputPath = path.join(
      tempDir,
      "compressed.pdf",
    );

    await fs.writeFile(inputPath, inputBuffer);

    const args = [
      "--compress-streams=y",
      "--decode-level=generalized",
      "--recompress-flate",
      "--object-streams=generate",
      inputPath,
      outputPath,
    ];

    await execFileAsync(QPDF_PATH, args, {
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024,
    });

    const outputBuffer = await fs.readFile(outputPath);

    if (outputBuffer.length === 0) {
      throw new Error("QPDF produced an empty output file.");
    }

    return new Response(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="compressed.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[QPDF] Compression error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unknown compression error.";

    return Response.json(
      {
        error:
          "PDF compression failed.",
        details: message,
      },
      { status: 500 },
    );
  } finally {
    if (tempDir) {
      try {
        await fs.rm(tempDir, {
          recursive: true,
          force: true,
        });
      } catch (cleanupError) {
        console.error(
          "[QPDF] Temporary file cleanup failed:",
          cleanupError,
        );
      }
    }
  }
}