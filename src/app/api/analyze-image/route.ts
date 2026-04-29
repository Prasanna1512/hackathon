import { callVisionModel } from "@/lib/amd/provider";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { imageData, imageName } = await req.json();
    if (!imageData && !imageName) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }
    const result = await callVisionModel(imageData ?? "", "Describe visible non-diagnostic observations only. Use cautious language.");
    return NextResponse.json({
      observations: result.observations,
      confidence: result.confidence,
      note: "Non-diagnostic placeholder observation. Full multimodal analysis requires AMD cloud deployment with Qwen2-VL or similar vision model.",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
