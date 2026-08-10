import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Compression is performed in the browser using qpdf WASM.",
    },
    { status: 410 },
  );
}