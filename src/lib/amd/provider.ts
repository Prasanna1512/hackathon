const cfg = {
  mode: (process.env.AMD_VLLM_BASE_URL ? "amd-cloud" : "demo-local") as "amd-cloud" | "demo-local",
  baseUrl: process.env.AMD_VLLM_BASE_URL ?? "",
  apiKey: process.env.AMD_VLLM_API_KEY ?? "",
  textModel: process.env.TEXT_MODEL_NAME ?? "Qwen2.5-7B-Instruct",
  visionModel: process.env.VISION_MODEL_NAME ?? "Qwen2-VL-7B-Instruct",
};

export const amdConfig = cfg;

export async function callTextModel(prompt: string): Promise<{ text: string; tokens: number }> {
  if (cfg.mode === "amd-cloud" && cfg.baseUrl) {
    const res = await fetch(`${cfg.baseUrl}/v1/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}) },
      body: JSON.stringify({ model: cfg.textModel, prompt, max_tokens: 512, temperature: 0.3 }),
    });
    const data = await res.json();
    return { text: data.choices?.[0]?.text ?? "", tokens: data.usage?.total_tokens ?? 0 };
  }
  return { text: `[Demo mode] Rule-based triage applied.`, tokens: Math.ceil(prompt.length / 4) };
}

export async function callVisionModel(imageBase64: string, prompt: string): Promise<{ observations: string[]; confidence: number; tokens: number }> {
  if (cfg.mode === "amd-cloud" && cfg.baseUrl) {
    const res = await fetch(`${cfg.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}) },
      body: JSON.stringify({
        model: cfg.visionModel,
        messages: [{ role: "user", content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64.slice(0, 100)}` } }
        ]}],
        max_tokens: 256,
      }),
    });
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    return { observations: text.split("\n").filter(Boolean), confidence: 0.6, tokens: data.usage?.total_tokens ?? 0 };
  }
  return {
    observations: [
      "Possible visible injury-related area detected (non-diagnostic observation)",
      "Image analyzed in demo mode — full multimodal analysis requires AMD cloud deployment",
    ],
    confidence: 0.55,
    tokens: 64,
  };
}
