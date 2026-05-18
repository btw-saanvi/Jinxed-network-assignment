import { fal } from '@fal-ai/client';

export class FalProviderError extends Error {
  public code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'FalProviderError';
    this.code = code;
  }
}

export async function generateImage(prompt: string, model: string, settings: Record<string, any> = {}): Promise<{ imageUrl: string }> {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [FAL] Starting image generation for model: ${model}, prompt: "${prompt}"`);

  try {
    const result = await fal.subscribe(model as any, {
      input: {
        prompt,
        ...settings,
      },
    });

    // The shape of result depends on the model, but generally includes an 'images' array.
    // We assume the standard return format for fal.ai flux/schnell models.
    const imageUrl = result.data?.images?.[0]?.url;

    if (!imageUrl) {
      throw new FalProviderError('No image URL returned from provider', 'NO_IMAGE_RETURNED');
    }

    const successTimestamp = new Date().toISOString();
    console.log(`[${successTimestamp}] [FAL] Successfully generated image for model: ${model}`);

    return { imageUrl };
  } catch (error: any) {
    const failureTimestamp = new Date().toISOString();
    console.error(`[${failureTimestamp}] [FAL] Failed to generate image:`, error);
    
    if (error instanceof FalProviderError) {
      throw error;
    }
    
    throw new FalProviderError(
      error.message || 'Unknown error occurred during image generation',
      error.code || 'UNKNOWN_ERROR'
    );
  }
}
