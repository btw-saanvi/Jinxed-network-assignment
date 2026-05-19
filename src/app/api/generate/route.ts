// src/app/api/generate/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateImage as hfGenerateImage } from '@/lib/providers/huggingface';
import { Buffer } from 'buffer';
export const runtime = 'nodejs';
import { generateImage as mockGenerateImage } from '@/lib/providers/mock';

export async function POST(request: Request) {
  const { prompt, model, generationId, settings = {} } = await request.json();

  if (!prompt || !model || !generationId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Choose provider (already done)
  const generateImage = process.env.HF_KEY ? hfGenerateImage : mockGenerateImage;

  try {
    // 1️⃣ Generate image (URL or data‑URI)
    const { imageUrl } = await generateImage(prompt, model, settings);
    console.log('Generated image URL:', imageUrl);

    // 2️⃣ Convert imageUrl → Buffer (Node‑friendly)
    let fileBuffer: Buffer;
    let mimeType = 'image/png';
    if (imageUrl.startsWith('data:')) {
      const base64 = imageUrl.split(',')[1];
      fileBuffer = Buffer.from(base64, 'base64');
      const mimeMatch = imageUrl.match(/^data:(image\/[^;]+);/);
      if (mimeMatch) mimeType = mimeMatch[1];
      console.log('Decoded data‑URI, mime:', mimeType);
    } else {
      const resp = await fetch(imageUrl);
      if (!resp.ok) throw new Error(`Failed to fetch remote image: ${resp.status}`);
      fileBuffer = Buffer.from(await resp.arrayBuffer());
      mimeType = resp.headers.get('content-type') ?? mimeType;
      console.log('Fetched remote image, mime:', mimeType);
    }

    // 3️⃣ Upload to Supabase Storage
    const fileName = `gen-${generationId}-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('generated-images')
      .upload(fileName, fileBuffer, {
        upsert: false,
        contentType: mimeType,
      });
    console.log('Upload result:', { uploadData, uploadError });

    if (uploadError) throw uploadError;

    // 4️⃣ Build the public URL
    const { data: publicUrlData } = supabase.storage
      .from('generated-images')
      .getPublicUrl(uploadData?.path ?? fileName);
    console.log('Public URL data:', publicUrlData);
    const publicUrl = publicUrlData?.publicUrl ?? imageUrl; // fallback to original if something odd

    // 5️⃣ Update the generation row with the public URL
    const { error: updateError } = await supabase
      .from('generations')
      .update({ status: 'done', image_url: publicUrl })
      .eq('id', generationId);

    if (updateError) throw updateError;

    return NextResponse.json({ imageUrl: publicUrl });
  } catch (err: unknown) {
    console.error('Generation error:', err);
    // On failure, mark generation as failed
    await supabase.from('generations').update({ status: 'failed' }).eq('id', generationId);
    const e = err as { message?: string };
    return NextResponse.json({ error: e.message || 'Image generation failed' }, { status: 500 });
  }
}
