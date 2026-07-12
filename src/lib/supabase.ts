import { getSupabase } from '@/lib/db';
import toast from 'react-hot-toast';

/** Upload a product image to the `product-images` bucket and return its public URL */
export const uploadProductImage = async (file: File, productId: number): Promise<string> => {
  const bucket = 'product-images';
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-');
  const filePath = `${productId}/${Date.now()}_${safeName}`;
  const supabase = getSupabase();

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    toast.error('Image upload failed');
    throw uploadError;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  toast.success('Image uploaded');
  return data.publicUrl;
};

/** Helper to wrap async actions with loading toasts */
export const withLoading = async <T>(promise: Promise<T>, loadingMessage = 'Processing…'): Promise<T> => {
  const id = toast.loading(loadingMessage);
  try {
    const result = await promise;
    toast.success('Done', { id });
    return result;
  } catch (e) {
    toast.error('Failed', { id });
    throw e;
  }
};
