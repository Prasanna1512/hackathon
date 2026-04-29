export const amdConfig = {
  mode: process.env.AMD_VLLM_BASE_URL ? "amd-cloud" : "demo-local",
  baseUrl: process.env.AMD_VLLM_BASE_URL,
  textModel: process.env.TEXT_MODEL_NAME ?? "Qwen2.5-7B-Instruct",
  visionModel: process.env.VISION_MODEL_NAME ?? "Qwen2-VL-7B-Instruct"
};

export async function callTextModel(prompt: string) {
  return { text: `Mock text model response in ${amdConfig.mode} mode`, tokens: Math.ceil(prompt.length / 4) };
}

export async function callVisionModel(imageName: string, prompt: string) {
  return { observations: [`Visible injury-like pattern in ${imageName}`], confidence: 0.62, tokens: Math.ceil((imageName.length + prompt.length) / 4) };
}
