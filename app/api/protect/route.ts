import { NextRequest } from "next/server";
import { encryptPDF } from "@pdfsmaller/pdf-encrypt";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    console.log("[Protect PDF] Request received.");

    const formData = await request.formData();

    const file = formData.get("file");
    const password = formData.get("password");

    // Validate file
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

    // Validate password
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

    // Validate PDF
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

    console.log(
      "[Protect PDF] Input:",
      fileName,
      file.size,
      "bytes",
    );

    // Read uploaded PDF
    const inputBytes = new Uint8Array(
      await file.arrayBuffer(),
    );

    if (inputBytes.length === 0) {
      return Response.json(
        {
          error: "The uploaded PDF is empty.",
        },
        {
          status: 400,
        },
      );
    }

    console.log(
      "[Protect PDF] Encrypting PDF with AES-256...",
    );

    /*
     * Encrypt the existing PDF directly.
     *
     * AES-256 is the default algorithm.
     *
     * The same password is used as:
     * - user password
     * - owner password
     *
     * Permissions are intentionally restricted.
     */
    const encryptedBytes = await encryptPDF(
      inputBytes,
      password,
      {
        ownerPassword: password,

        allowPrinting: true,
        allowModifying: false,
        allowCopying: false,
        allowAnnotating: false,
        allowFillingForms: true,
        allowExtraction: false,
        allowAssembly: false,
        allowHighQualityPrint: true,
      },
    );

    if (!encryptedBytes || encryptedBytes.length === 0) {
      throw new Error(
        "Encryption returned an empty PDF.",
      );
    }

    console.log(
      "[Protect PDF] Encryption successful.",
      encryptedBytes.length,
      "bytes",
    );

    // Create safe download filename
    const safeName = fileName
      .replace(/\.pdf$/i, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 100);

    const downloadName =
      `${safeName || "document"}-protected.pdf`;

    console.log(
      "[Protect PDF] Download:",
      downloadName,
    );

    return new Response(
      Buffer.from(encryptedBytes),
      {
        status: 200,

        headers: {
          "Content-Type": "application/pdf",

          "Content-Disposition":
            `attachment; filename="${downloadName}"`,

          "Content-Length":
            encryptedBytes.length.toString(),

          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "[Protect PDF] Conversion error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    return Response.json(
      {
        error:
          message ||
          "Unable to protect this PDF.",
      },
      {
        status: 500,
      },
    );
  }
}