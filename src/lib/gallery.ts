import { supabase } from '@/lib/supabase';
import { Generation } from '@/types/generation';
import { toast } from 'sonner';

export async function createGeneration(
  prompt: string,
  model: string,
  settings: Record<string, unknown> = {},
  tweakOf?: string | null
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('generations')
      .insert([
        {
          prompt,
          model,
          settings,
          status: 'pending',
          tweak_of: tweakOf || null,
        },
      ])
      .select('id')
      .single();

    if (error) throw error;
    if (!data) throw new Error('No data returned from Supabase');

    return data.id;
  } catch (error: unknown) {
    const err = error as Error;
    if (typeof window !== 'undefined') toast.error(`Database error: ${err.message || 'Failed to save generation'}`);
    throw error;
  }
}

export async function getGenerations(): Promise<Generation[]> {
  try {
    const { data, error } = await supabase
      .from('generations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Generation[];
  } catch (error: unknown) {
    const err = error as Error;
    if (typeof window !== 'undefined') toast.error(`Database error: ${err.message || 'Failed to fetch gallery'}`);
    throw error;
  }
}

export async function getGeneration(id: string): Promise<Generation> {
  try {
    const { data, error } = await supabase
      .from('generations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error(`Generation with ID ${id} not found`);

    return data as Generation;
  } catch (error: unknown) {
    const err = error as Error;
    if (typeof window !== 'undefined') toast.error(`Database error: ${err.message || 'Failed to fetch generation'}`);
    throw error;
  }
}

export async function deleteGeneration(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('generations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error: unknown) {
    const err = error as Error;
    if (typeof window !== 'undefined') toast.error(`Database error: ${err.message || 'Failed to delete generation'}`);
    throw error;
  }
}
