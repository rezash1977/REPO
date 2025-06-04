
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Ad {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  description: string | null;
  price: number | null;
  location: string | null;
  phone: string | null;
  status: 'pending' | 'active' | 'expired' | 'rejected';
  images: string[];
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

export const useAds = (categorySlug?: string) => {
  return useQuery({
    queryKey: ['ads', categorySlug],
    queryFn: async () => {
      let query = supabase
        .from('ads')
        .select(`
          *,
          categories!inner(slug, name)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (categorySlug) {
        query = query.eq('categories.slug', categorySlug);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching ads:', error);
        throw error;
      }
      
      return data as (Ad & { categories: { slug: string; name: string } })[];
    },
  });
};

export const useAdById = (adId: string) => {
  return useQuery({
    queryKey: ['ad', adId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ads')
        .select(`
          *,
          categories(name, slug)
        `)
        .eq('id', adId)
        .single();
      
      if (error) {
        console.error('Error fetching ad:', error);
        throw error;
      }
      
      return data;
    },
  });
};
