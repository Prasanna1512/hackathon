import { analyzeCase } from "@/lib/agents/orchestrator";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const result = await analyzeCase(payload);
  return NextResponse.json(result);
}
