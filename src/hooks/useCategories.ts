
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  color: string;
  created_at: string;
}

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      console.log('Fetching categories...');
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }
      
      console.log('Categories fetched successfully:', data);
      return data as Category[];
    },
  });
};
