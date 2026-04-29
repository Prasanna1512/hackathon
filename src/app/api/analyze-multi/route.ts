import { analyzeCase } from "@/lib/agents/orchestrator";
import { CaseInput, TriageResult } from "@/lib/schemas/types";
import { NextRequest, NextResponse } from "next/server";

const PRIORITY_RANK: Record<string, number> = { "P1 Immediate": 1, "P2 Urgent": 2, "P3 Delayed": 3, "P4 Minor": 4, Unknown: 5 };

function tiebreaker(a: TriageResult, b: TriageResult): number {
  const rankDiff = (PRIORITY_RANK[a.priority] ?? 5) - (PRIORITY_RANK[b.priority] ?? 5);
  if (rankDiff !== 0) return rankDiff;
  // Same priority: sort by red flag count desc, then by breathing/consciousness severity
  return b.redFlags.length - a.redFlags.length;
}

export async function POST(req: NextRequest) {
  try {
    const { cases } = await req.json();
    if (!Array.isArray(cases) || cases.length === 0) {
      return NextResponse.json({ error: "Provide an array of cases" }, { status: 400 });
    }
    const results: TriageResult[] = await Promise.all(
      cases.map((c: CaseInput, i: number) => analyzeCase({ ...c, caseId: c.caseId ?? c.label ?? `Patient ${i + 1}` }))
    );
    results.sort(tiebreaker);
    return NextResponse.json({ results });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
