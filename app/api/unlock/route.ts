import { NextRequest } from "next/server";
import { decryptPDF } from "@pdfsmaller/pdf-decrypt";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    console.log("[Unlock PDF] Request received.");

    const formData = await request.formData();

    const file = formData.get("file");
    const password = formData.get("password");

    // -----------------------------
    // Validate file
    // -----------------------------
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

    // -----------------------------
    // Validate password
    // -----------------------------
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

    // -----------------------------
    // Validate PDF
    // -----------------------------
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

    console.log(
      "[Unlock PDF] Input:",
      fileName,
      file.size,
      "bytes",
    );

    // -----------------------------
    // Read uploaded PDF
    // -----------------------------
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
      "[Unlock PDF] Decrypting PDF...",
    );

    // -----------------------------
    // Decrypt PDF
    // -----------------------------
    const decryptedBytes = await decryptPDF(
      inputBytes,
      password,
    );

    if (
      !decryptedBytes ||
      decryptedBytes.length === 0
    ) {
      throw new Error(
        "Decryption returned an empty PDF.",
      );
    }

    console.log(
      "[Unlock PDF] Decryption successful.",
      decryptedBytes.length,
      "bytes",
    );

    // -----------------------------
    // Safe download filename
    // -----------------------------
    const safeName = fileName
      .replace(/\.pdf$/i, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 100);

    const downloadName =
      `${safeName || "document"}-unlocked.pdf`;

    console.log(
      "[Unlock PDF] Download:",
      downloadName,
    );

    // -----------------------------
    // Return unlocked PDF
    // -----------------------------
    return new Response(
      Buffer.from(decryptedBytes),
      {
        status: 200,

        headers: {
          "Content-Type": "application/pdf",

          "Content-Disposition":
            `attachment; filename="${downloadName}"`,

          "Content-Length":
            decryptedBytes.length.toString(),

          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "[Unlock PDF] ERROR:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    // Wrong password
    if (
      message
        .toLowerCase()
        .includes("incorrect password")
    ) {
      return Response.json(
        {
          error:
            "Incorrect PDF password. Please enter the correct password.",
        },
        {
          status: 400,
        },
      );
    }

    // PDF is not encrypted
    if (
      message
        .toLowerCase()
        .includes("not encrypted")
    ) {
      return Response.json(
        {
          error:
            "This PDF is not password protected.",
        },
        {
          status: 400,
        },
      );
    }

    // Unsupported encryption
    if (
      message
        .toLowerCase()
        .includes("unsupported encryption")
    ) {
      return Response.json(
        {
          error:
            "This PDF uses an unsupported encryption method.",
        },
        {
          status: 400,
        },
      );
    }

    return Response.json(
      {
        error:
          message ||
          "Unable to unlock this PDF.",
      },
      {
        status: 500,
      },
    );
  }
}