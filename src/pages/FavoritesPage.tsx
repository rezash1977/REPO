import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { Link } from 'react-router-dom';

interface Favorite { ad_id: string; }
interface Ad {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

const FavoritesPage: React.FC = () => {
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return;
      setLoading(true);
      // فرض بر این است که جدول favorites دارای user_id و ad_id است
      // و ads اطلاعات آگهی را نگه می‌دارد
      const { data: favs, error: favsError } = await supabase
        .from('favorites')
        .select('ad_id')
        .eq('user_id', user.id);
      if (favsError || !favs || favs.length === 0) {
        setAds([]);
        setLoading(false);
        return;
      }
      const adIds = favs.map((f: Favorite) => f.ad_id);
      const { data: adsData, error: adsError } = await supabase
        .from('ads')
        .select('id, title, status, created_at')
        .in('id', adIds);
      if (!adsError && adsData) {
        setAds(adsData);
      } else {
        setAds([]);
      }
      setLoading(false);
    };
    fetchFavorites();
  }, [user]);

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
            <CardTitle>لیست آگهی‌های نشان شده</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader className="animate-spin w-8 h-8 text-violet-600" />
                <span className="mr-2">در حال بارگذاری...</span>
              </div>
            ) : ads.length === 0 ? (
              <div className="text-center py-8 text-gray-500">شما هیچ آگهی را نشان نکرده‌اید.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>عنوان</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>تاریخ ثبت</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ads.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell>{ad.title}</TableCell>
                      <TableCell>{ad.status || '-'}</TableCell>
                      <TableCell>{new Date(ad.created_at).toLocaleDateString('fa-IR')}</TableCell>
                      <TableCell>
                        <Link to={`/ad/${ad.id}`} className="text-violet-600 hover:underline">مشاهده</Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
      <Navbar />
    </div>
  );
};

export default FavoritesPage; 