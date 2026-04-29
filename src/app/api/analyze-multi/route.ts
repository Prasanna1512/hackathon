import { analyzeCase } from "@/lib/agents/orchestrator";
import { NextRequest, NextResponse } from "next/server";

const rank = { "P1 Immediate": 1, "P2 Urgent": 2, "P3 Delayed": 3, "P4 Minor": 4, Unknown: 5 } as const;

export async function POST(req: NextRequest) {
  const { cases } = await req.json();
  const results = await Promise.all(cases.map((c: any) => analyzeCase(c)));
  results.sort((a, b) => rank[a.priority] - rank[b.priority]);
  return NextResponse.json({ results });
}
