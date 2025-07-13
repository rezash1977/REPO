import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // دریافت لیست آگهی‌های نشان شده
  const fetchFavorites = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('ad_id')
        .eq('user_id', user.id);
      
      if (!error && data) {
        setFavorites(data.map(fav => fav.ad_id));
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  // بررسی اینکه آیا آگهی نشان شده است
  const isFavorite = (adId: string) => {
    return favorites.includes(adId);
  };

  // نشان کردن آگهی
  const addToFavorites = async (adId: string) => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, ad_id: adId });
      
      if (!error) {
        setFavorites(prev => [...prev, adId]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return false;
    }
  };

  // حذف از نشان شده‌ها
  const removeFromFavorites = async (adId: string) => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('ad_id', adId);
      
      if (!error) {
        setFavorites(prev => prev.filter(id => id !== adId));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return false;
    }
  };

  // تغییر وضعیت نشان کردن
  const toggleFavorite = async (adId: string) => {
    if (isFavorite(adId)) {
      return await removeFromFavorites(adId);
    } else {
      return await addToFavorites(adId);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  return {
    favorites,
    loading,
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    refetch: fetchFavorites
  };
}; 