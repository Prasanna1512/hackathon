import { analyzeCase } from "@/lib/agents/orchestrator";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }
    const result = await analyzeCase(payload);
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
