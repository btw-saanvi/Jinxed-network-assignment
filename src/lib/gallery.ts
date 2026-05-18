import { supabase } from '@/lib/supabase';
import { Generation } from '@/types/generation';

export async function createGeneration(
  prompt: string,
  model: string,
  settings: Record<string, any> = {}
): Promise<string> {
  const { data, error } = await supabase
    .from('generations')
    .insert([
      {
        prompt,
        model,
        settings,
        status: 'pending',
      },
    ])
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create generation: ${error.message}`);
  }

  if (!data) {
    throw new Error('Failed to create generation: No data returned from Supabase');
  }

  return data.id;
}

export async function getGenerations(): Promise<Generation[]> {
  const { data, error } = await supabase
    .from('generations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch generations: ${error.message}`);
  }

  return data as Generation[];
}

export async function getGeneration(id: string): Promise<Generation> {
  const { data, error } = await supabase
    .from('generations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch generation with ID ${id}: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Generation with ID ${id} not found`);
  }

  return data as Generation;
}

export async function deleteGeneration(id: string): Promise<void> {
  const { error } = await supabase
    .from('generations')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete generation with ID ${id}: ${error.message}`);
  }
}
