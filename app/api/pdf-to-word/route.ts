import { PDFExtract } from "pdf.js-extract";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    console.log("[PDF to Word] Request received.");

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

    const isPdf =
      uploadedFile.type === "application/pdf" ||
      uploadedFile.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      return Response.json(
        {
          error: "Only PDF files are supported.",
        },
        { status: 400 },
      );
    }

    const pdfBuffer = Buffer.from(
      await uploadedFile.arrayBuffer(),
    );

    if (pdfBuffer.length === 0) {
      return Response.json(
        {
          error: "The uploaded PDF is empty.",
        },
        { status: 400 },
      );
    }

    console.log(
      "[PDF to Word] Input:",
      uploadedFile.name,
      pdfBuffer.length,
      "bytes",
    );

    const pdfExtract = new PDFExtract();

    const data = await new Promise<{
      pages: Array<{
        content?: Array<{
          str?: string;
          x?: number;
          y?: number;
        }>;
      }>;
    }>((resolve, reject) => {
      pdfExtract.extractBuffer(
        pdfBuffer,
        {},
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          if (!result) {
            reject(
              new Error(
                "Unable to extract text from the PDF.",
              ),
            );
            return;
          }

          resolve(result);
        },
      );
    });

    console.log(
      "[PDF to Word] Pages:",
      data.pages.length,
    );

    const paragraphs: Paragraph[] = [];

    for (
      let pageIndex = 0;
      pageIndex < data.pages.length;
      pageIndex++
    ) {
      const page = data.pages[pageIndex];

      const lines = new Map<number, string[]>();

      for (const item of page.content ?? []) {
        const text = String(item.str ?? "").trim();

        if (!text) {
          continue;
        }

        const y =
          Math.round(Number(item.y ?? 0) * 10) / 10;

        if (!lines.has(y)) {
          lines.set(y, []);
        }

        lines.get(y)!.push(text);
      }

      const sortedLines = Array.from(
        lines.entries(),
      ).sort(
        ([y1], [y2]) => y1 - y2,
      );

      for (const [, textParts] of sortedLines) {
        const text = textParts
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        if (!text) {
          continue;
        }

        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text,
              }),
            ],
            spacing: {
              after: 120,
            },
          }),
        );
      }

      if (
        pageIndex < data.pages.length - 1
      ) {
        paragraphs.push(
          new Paragraph({
            text: "",
            pageBreakBefore: true,
          }),
        );
      }
    }

    if (paragraphs.length === 0) {
      return Response.json(
        {
          error:
            "No readable text was found in this PDF.",
        },
        { status: 422 },
      );
    }

    console.log(
      "[PDF to Word] Creating DOCX...",
    );

    const document = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    const docxBuffer =
      await Packer.toBuffer(document);

    if (
      !docxBuffer ||
      docxBuffer.length === 0
    ) {
      throw new Error(
        "The generated Word document is empty.",
      );
    }

    const originalName =
      uploadedFile.name.replace(
        /\.pdf$/i,
        "",
      );

    const outputName =
      `${originalName}.docx`;

    console.log(
      "[PDF to Word] Output:",
      outputName,
      docxBuffer.length,
      "bytes",
    );

    return new Response(
      new Uint8Array(docxBuffer),
      {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

          "Content-Disposition":
            `attachment; filename="${outputName}"`,

          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "[PDF to Word] Conversion error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unknown conversion error.";

    return Response.json(
      {
        error:
          "PDF to Word conversion failed.",
        details: message,
      },
      { status: 500 },
    );
  }
}