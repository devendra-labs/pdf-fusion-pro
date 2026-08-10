import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { spawn } from "child_process";

export const runtime = "nodejs";

function getQpdfPath(): string {
  // Render / Linux:
  // qpdf should be available in PATH.
  //
  // Windows local development:
  // set QPDF_PATH if qpdf is not in PATH.
  return process.env.QPDF_PATH || "qpdf";
}

function runQpdf(
  inputPath: string,
  outputPath: string,
  password: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const qpdfPath = getQpdfPath();

    /*
     * qpdf encryption syntax:
     *
     * qpdf --encrypt USER-PASSWORD OWNER-PASSWORD 256 \
     *      [encryption options] \
     *      -- input.pdf output.pdf
     *
     * We use the same password as both the user and owner
     * password for this simple Protect PDF tool.
     */

    const args = [
      "--encrypt",
      password,
      password,
      "256",

      "--extract=y",
      "--print=full",
      "--modify=none",
      "--annotate=n",

      "--",
      inputPath,
      outputPath,
    ];

    console.log("[Protect PDF] Starting qpdf");
    console.log("[Protect PDF] Executable:", qpdfPath);
    console.log("[Protect PDF] Input:", inputPath);
    console.log("[Protect PDF] Output:", outputPath);

    const qpdfProcess = spawn(/* turbopackIgnore: true */ qpdfPath, args, {
  windowsHide: true,
});

    let stdout = "";
    let stderr = "";

    qpdfProcess.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    qpdfProcess.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    qpdfProcess.on("error", (error) => {
      console.error(
        "[Protect PDF] Failed to start qpdf:",
        error,
      );

      reject(error);
    });

    qpdfProcess.on("close", (code) => {
      console.log(
        "[Protect PDF] qpdf exited with code:",
        code,
      );

      if (stdout) {
        console.log(
          "[Protect PDF] stdout:",
          stdout,
        );
      }

      if (stderr) {
        console.log(
          "[Protect PDF] stderr:",
          stderr,
        );
      }

      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          stderr.trim() ||
            `qpdf exited with code ${code ?? "unknown"}`,
        ),
      );
    });
  });
}

export async function POST(request: NextRequest) {
  let tempDir: string | null = null;

  try {
    const formData = await request.formData();

    const file = formData.get("file");
    const password = formData.get("password");

    if (!(file instanceof File)) {
      return Response.json(
        {
          error: "Please select a PDF file.",
        },
        {
          status: 400,
        },
      );
    }

    if (typeof password !== "string") {
      return Response.json(
        {
          error: "Please enter a password.",
        },
        {
          status: 400,
        },
      );
    }

    if (password.length < 4) {
      return Response.json(
        {
          error:
            "Password must contain at least 4 characters.",
        },
        {
          status: 400,
        },
      );
    }

    const fileName = file.name || "document.pdf";

    if (
      file.type !== "application/pdf" &&
      !fileName.toLowerCase().endsWith(".pdf")
    ) {
      return Response.json(
        {
          error: "Only PDF files are supported.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Create temporary working directory.
     *
     * This works both locally and on a Linux container
     * such as Render.
     */
    tempDir = await fs.mkdtemp(
      path.join(
        os.tmpdir(),
        "pdf-fusion-protect-",
      ),
    );

    const id = crypto.randomUUID();

    const inputPath = path.join(
      tempDir,
      `${id}-input.pdf`,
    );

    const outputPath = path.join(
      tempDir,
      `${id}-protected.pdf`,
    );

    const inputBuffer = Buffer.from(
      await file.arrayBuffer(),
    );

    await fs.writeFile(
      inputPath,
      inputBuffer,
    );

    console.log(
      "[Protect PDF] Input PDF saved:",
      inputPath,
    );

    /*
     * Run qpdf encryption.
     */
    await runQpdf(
      inputPath,
      outputPath,
      password,
    );

    /*
     * Make sure qpdf actually produced the output.
     */
    const outputBuffer = await fs.readFile(
      outputPath,
    );

    if (!outputBuffer.length) {
      throw new Error(
        "qpdf generated an empty output file.",
      );
    }

    const safeName = fileName
      .replace(/\.pdf$/i, "")
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .slice(0, 100);

    const downloadName =
      `${safeName || "document"}-protected.pdf`;

    console.log(
      "[Protect PDF] Protection successful:",
      downloadName,
    );

    return new Response(outputBuffer, {
      status: 200,

      headers: {
        "Content-Type": "application/pdf",

        "Content-Disposition":
          `attachment; filename="${downloadName}"`,

        "Content-Length":
          outputBuffer.length.toString(),

        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(
      "[Protect PDF] ERROR:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    /*
     * Give useful errors during local development.
     */
    if (
      message.includes("ENOENT") ||
      message.includes("spawn qpdf")
    ) {
      return Response.json(
        {
          error:
            "qpdf was not found. Make sure qpdf is installed and QPDF_PATH is configured correctly.",
        },
        {
          status: 500,
        },
      );
    }

    return Response.json(
      {
        error:
          "Unable to protect this PDF. Check the terminal for the qpdf error.",
      },
      {
        status: 500,
      },
    );
  } finally {
    /*
     * Delete temporary files after processing.
     */
    if (tempDir) {
      try {
        await fs.rm(tempDir, {
          recursive: true,
          force: true,
        });

        console.log(
          "[Protect PDF] Temporary files cleaned.",
        );
      } catch (cleanupError) {
        console.error(
          "[Protect PDF] Cleanup error:",
          cleanupError,
        );
      }
    }
  }
}