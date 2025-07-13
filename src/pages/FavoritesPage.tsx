import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader, Heart, Trash2 } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { Link } from 'react-router-dom';
import { useFavorites } from '@/hooks/useFavorites';
import { useToast } from '@/components/ui/use-toast';

interface Ad {
  id: string;
  title: string;
  status: string;
  price?: number | null;
  location?: string | null;
  images?: string[];
  created_at: string;
}

const FavoritesPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const { favorites, removeFromFavorites, refetch } = useFavorites();

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // دریافت آگهی‌های نشان شده
        const { data: favs, error: favsError } = await supabase
          .from('favorites')
          .select('ad_id')
          .eq('user_id', user.id);
        
        if (favsError || !favs || favs.length === 0) {
          setAds([]);
          setLoading(false);
          return;
        }
        
        const adIds = favs.map((f: any) => f.ad_id);
        
        // دریافت اطلاعات آگهی‌ها
        const { data: adsData, error: adsError } = await supabase
          .from('ads')
          .select('id, title, status, price, location, images, created_at')
          .in('id', adIds)
          .order('created_at', { ascending: false });
        
        if (!adsError && adsData) {
          setAds(adsData);
        } else {
          setAds([]);
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
        setAds([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFavorites();
  }, [user, favorites]);

  const handleRemoveFavorite = async (adId: string) => {
    const success = await removeFromFavorites(adId);
    if (success) {
      setAds(prev => prev.filter(ad => ad.id !== adId));
      toast({
        title: 'آگهی از نشان شده‌ها حذف شد',
        variant: 'default'
      });
    } else {
      toast({
        title: 'خطا در حذف از نشان شده‌ها',
        variant: 'destructive'
      });
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'توافقی';
    return `${Number(price).toLocaleString('fa-IR')} تومان`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-primary text-white">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">آگهی‌های نشان شده</h1>
        </div>
      </div>
      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              لیست آگهی‌های نشان شده
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader className="animate-spin w-8 h-8 text-violet-600" />
                <span className="mr-2">در حال بارگذاری...</span>
              </div>
            ) : ads.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p>شما هیچ آگهی را نشان نکرده‌اید.</p>
                <Link to="/" className="text-primary mt-2 inline-block">مشاهده آگهی‌ها</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {ads.map((ad) => (
                  <div key={ad.id} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4">
                    {/* تصویر آگهی */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={ad.images && ad.images.length > 0 ? ad.images[0] : 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop'}
                        alt={ad.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* اطلاعات آگهی */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm mb-1 truncate">{ad.title}</h3>
                      <p className="text-green-600 font-bold text-xs mb-1">{formatPrice(ad.price)}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{ad.location || 'موقعیت نامشخص'}</span>
                        <span>{new Date(ad.created_at).toLocaleDateString('fa-IR')}</span>
                      </div>
                    </div>
                    
                    {/* دکمه‌های عملیات */}
                    <div className="flex items-center gap-2">
                      <Link 
                        to={`/ad/${ad.id}`} 
                        className="bg-primary text-white px-3 py-2 rounded-lg text-xs hover:bg-primary/90 transition-colors"
                      >
                        مشاهده
                      </Link>
                      <button
                        onClick={() => handleRemoveFavorite(ad.id)}
                        className="bg-red-100 text-red-600 px-3 py-2 rounded-lg text-xs hover:bg-red-200 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Navbar />
    </div>
  );
};

export default FavoritesPage; 