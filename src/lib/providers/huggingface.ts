export class HuggingFaceProviderError extends Error {
  public code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'HuggingFaceProviderError';
    this.code = code;
  }
}

export async function generateImage(
  prompt: string,
  model: string,
  settings: Record<string, unknown> = {}
): Promise<{ imageUrl: string }> {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [HUGGINGFACE] Starting image generation for model: ${model}, prompt: "${prompt}"`);

  if (!process.env.HF_KEY) {
    throw new HuggingFaceProviderError('HF_KEY environment variable is not defined', 'MISSING_API_KEY');
  }

  try {
    const body: Record<string, unknown> = {
      inputs: prompt,
    };

    // If negative prompt settings are present, we can pass them in the parameters object
    if (settings && settings.negative_prompt) {
      body.parameters = {
        negative_prompt: settings.negative_prompt,
      };
    }

    const response = await fetch(
      'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HF_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to generate image from Hugging Face';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new HuggingFaceProviderError(errorMessage, `HTTP_${response.status}`);
    }

    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const imageUrl = `data:image/jpeg;base64,${base64}`;

    const successTimestamp = new Date().toISOString();
    console.log(`[${successTimestamp}] [HUGGINGFACE] Successfully generated image`);

    return { imageUrl };
  } catch (error: unknown) {
    const failureTimestamp = new Date().toISOString();
    console.error(`[${failureTimestamp}] [HUGGINGFACE] Failed to generate image:`, error);

    if (error instanceof HuggingFaceProviderError) {
      throw error;
    }

    const err = error as { message?: string; code?: string };
    throw new HuggingFaceProviderError(
      err.message || 'Unknown error occurred during Hugging Face image generation',
      err.code || 'UNKNOWN_ERROR'
    );
  }
}
