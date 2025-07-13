import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Ad } from './useAds';
import { Category } from './useCategories';

export interface SearchResult {
  ads: (Ad & { categories: { slug: string; name: string } })[];
  suggestedCategories: Category[];
}

export const useSearch = (searchTerm: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['search', searchTerm],
    queryFn: async (): Promise<SearchResult> => {
      if (!searchTerm.trim()) {
        return { ads: [], suggestedCategories: [] };
      }

      // Search ads
      const { data: adsData, error: adsError } = await supabase
        .from('ads')
        .select(`
          *,
          categories!inner(slug, name)
        `)
        .eq('status', 'active')
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (adsError) {
        console.error('Error searching ads:', adsError);
        throw adsError;
      }

      // Search categories for suggestions
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .order('name')
        .limit(5);

      if (categoriesError) {
        console.error('Error searching categories:', categoriesError);
        throw categoriesError;
      }

      return {
        ads: adsData as (Ad & { categories: { slug: string; name: string } })[],
        suggestedCategories: categoriesData as Category[]
      };
    },
    enabled: enabled && searchTerm.trim().length > 0,
    staleTime: 30000, // 30 seconds
  });
};

export const useSearchSuggestions = (searchTerm: string) => {
  return useQuery({
    queryKey: ['searchSuggestions', searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim() || searchTerm.length < 2) {
        return [];
      }

      // Get popular search terms from ads titles
      const { data, error } = await supabase
        .from('ads')
        .select('title')
        .eq('status', 'active')
        .ilike('title', `%${searchTerm}%`)
        .limit(5);

      if (error) {
        console.error('Error fetching search suggestions:', error);
        return [];
      }

      // Extract unique words that contain the search term
      const suggestions = new Set<string>();
      data.forEach(ad => {
        const words = ad.title.split(' ');
        words.forEach(word => {
          if (word.toLowerCase().includes(searchTerm.toLowerCase()) && word.length > 2) {
            suggestions.add(word);
          }
        });
      });

      return Array.from(suggestions).slice(0, 5);
    },
    enabled: searchTerm.trim().length >= 2,
    staleTime: 60000, // 1 minute
  });
}; 