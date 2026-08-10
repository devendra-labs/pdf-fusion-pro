import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { spawn } from "child_process";

export const runtime = "nodejs";

function getQpdfPath(): string {
  return process.env.QPDF_PATH || "qpdf";
}

function runQpdf(
  inputPath: string,
  outputPath: string,
  password: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const qpdfPath = getQpdfPath();

    const args = [
      `--password=${password}`,
      "--decrypt",
      "--",
      inputPath,
      outputPath,
    ];

    console.log("[Unlock PDF] Starting qpdf");
    console.log("[Unlock PDF] Executable:", qpdfPath);

    const qpdfProcess = spawn(
  /* turbopackIgnore: true */ qpdfPath,
  args,
  {
    windowsHide: true,
  },
);

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
        "[Unlock PDF] Failed to start qpdf:",
        error,
      );

      reject(error);
    });

    qpdfProcess.on("close", (code) => {
      console.log(
        "[Unlock PDF] qpdf exited with code:",
        code,
      );

      if (stdout) {
        console.log(
          "[Unlock PDF] stdout:",
          stdout,
        );
      }

      if (stderr) {
        console.log(
          "[Unlock PDF] stderr:",
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
          error: "Please enter the PDF password.",
        },
        {
          status: 400,
        },
      );
    }

    if (!password) {
      return Response.json(
        {
          error: "Please enter the PDF password.",
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

    tempDir = await fs.mkdtemp(
      path.join(
        os.tmpdir(),
        "pdf-fusion-unlock-",
      ),
    );

    const id = crypto.randomUUID();

    const inputPath = path.join(
      tempDir,
      `${id}-input.pdf`,
    );

    const outputPath = path.join(
      tempDir,
      `${id}-unlocked.pdf`,
    );

    const inputBuffer = Buffer.from(
      await file.arrayBuffer(),
    );

    await fs.writeFile(
      inputPath,
      inputBuffer,
    );

    console.log(
      "[Unlock PDF] Input PDF saved:",
      inputPath,
    );

    await runQpdf(
      inputPath,
      outputPath,
      password,
    );

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
      `${safeName || "document"}-unlocked.pdf`;

    console.log(
      "[Unlock PDF] Unlock successful:",
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
      "[Unlock PDF] ERROR:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : String(error);

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

    /*
     * qpdf returns an error when the password is wrong
     * or the PDF cannot be decrypted.
     */
    if (
      message.toLowerCase().includes("password") ||
      message.toLowerCase().includes("decrypt") ||
      message.toLowerCase().includes("encryption")
    ) {
      return Response.json(
        {
          error:
            "Incorrect password or this PDF could not be decrypted.",
        },
        {
          status: 400,
        },
      );
    }

    return Response.json(
      {
        error:
          "Unable to unlock this PDF. Please check the password and make sure the PDF is valid.",
      },
      {
        status: 400,
      },
    );
  } finally {
    if (tempDir) {
      try {
        await fs.rm(tempDir, {
          recursive: true,
          force: true,
        });

        console.log(
          "[Unlock PDF] Temporary files cleaned.",
        );
      } catch (cleanupError) {
        console.error(
          "[Unlock PDF] Cleanup error:",
          cleanupError,
        );
      }
    }
  }
}