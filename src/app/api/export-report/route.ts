import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { report } = await req.json();
    if (!report) return NextResponse.json({ error: "No report content" }, { status: 400 });
    return new NextResponse(report, {
      headers: { "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": 'attachment; filename="fieldmedic-handoff-report.md"' },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
