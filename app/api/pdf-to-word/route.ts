import { PDFExtract } from "pdf.js-extract";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

export const runtime = "nodejs";

const pdfExtract = new PDFExtract();

export async function POST(request: Request) {
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

    /*
     * pdf.js-extract expects a file path or
     * PDF data depending on the method.
     *
     * We use the buffer directly so the user
     * does not need to install anything.
     */
    const data = await new Promise<{
      pages: Array<{
        content: Array<{
          str: string;
          x: number;
          y: number;
          width: number;
          height: number;
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
                "Unable to extract text from PDF.",
              ),
            );
            return;
          }

          resolve(result);
        },
      );
    });

    const paragraphs: Paragraph[] = [];

    for (const page of data.pages) {
      const lines = new Map<
        number,
        string[]
      >();

      for (const item of page.content) {
        const y =
          Math.round(item.y * 10) / 10;

        if (!lines.has(y)) {
          lines.set(y, []);
        }

        lines.get(y)!.push(item.str);
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

      // Page separation
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "",
            }),
          ],
          pageBreakBefore: true,
        }),
      );
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

    const originalName =
      uploadedFile.name.replace(
        /\.pdf$/i,
        "",
      );

    const outputName =
      `${originalName}.docx`;

    return new Response(
      new Uint8Array(docxBuffer),
      {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition":
            `attachment; filename="${outputName}"`,
          "Cache-Control": "no-store",
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