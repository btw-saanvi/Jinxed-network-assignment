import { NextResponse } from 'next/server';
import { generateImage as falGenerateImage } from '@/lib/providers/fal';
import { generateImage as mockGenerateImage } from '@/lib/providers/mock';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, model, generationId, settings = {} } = body;

    if (!prompt || !model || !generationId) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt, model, and generationId are required' },
        { status: 400 }
      );
    }

    const hasFalKey = !!process.env.FAL_KEY;
    const generateImage = hasFalKey ? falGenerateImage : mockGenerateImage;

    try {
      const { imageUrl } = await generateImage(prompt, model, settings);

      const { error: updateError } = await supabase
        .from('generations')
        .update({ status: 'done', image_url: imageUrl })
        .eq('id', generationId);

      if (updateError) {
        console.error('Failed to update generation status to done:', updateError);
        // We still return the image URL even if the DB update fails, but we log the error.
      }

      return NextResponse.json({ imageUrl });
    } catch (error: unknown) {
      const { error: updateError } = await supabase
        .from('generations')
        .update({ status: 'failed' })
        .eq('id', generationId);

      if (updateError) {
        console.error('Failed to update generation status to failed:', updateError);
      }

      const err = error as { message?: string };
      return NextResponse.json(
        { error: err.message || 'Image generation failed' },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Unhandled API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
