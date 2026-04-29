import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { imageName } = await req.json();
  return NextResponse.json({ observations: [`Possible visible injury-related area in ${imageName}.`], confidence: 0.62, note: "Non-diagnostic placeholder multimodal observation." });
}
