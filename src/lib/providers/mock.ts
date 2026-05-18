export async function generateImage(prompt: string, model: string, settings: Record<string, any> = {}): Promise<{ imageUrl: string }> {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [MOCK] Starting image generation for model: ${model}, prompt: "${prompt}"`);

  // Simulate 2s delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const successTimestamp = new Date().toISOString();
  console.log(`[${successTimestamp}] [MOCK] Successfully generated image for model: ${model}`);

  // Adding a random seed to picsum to ensure unique images
  const randomSeed = Math.floor(Math.random() * 1000000);
  return { imageUrl: `https://picsum.photos/seed/${randomSeed}/1024/1024` };
}
