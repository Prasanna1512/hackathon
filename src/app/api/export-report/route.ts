import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { report } = await req.json();
  return new NextResponse(report, { headers: { "Content-Type": "text/markdown" } });
}
