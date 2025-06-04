import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { Link } from 'react-router-dom';

interface Ad {
  id: string;
  title: string;
  status: string;
  price?: number | null;
  views?: number;
  created_at: string;
}

const MyAdsPage: React.FC = () => {
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAds = async () => {
      if (!user) return;
      setLoading(true);
      // فرض بر این است که ads جدول دارای فیلد views است
      const { data, error } = await supabase
        .from('ads')
        .select('id, title, status, price, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setAds(data);
      }
      setLoading(false);
    };
    fetchAds();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-primary text-white">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">آگهی‌های من</h1>
        </div>
      </div>
      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>لیست آگهی‌های شما</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader className="animate-spin w-8 h-8 text-violet-600" />
                <span className="mr-2">در حال بارگذاری...</span>
              </div>
            ) : ads.length === 0 ? (
              <div className="text-center py-8 text-gray-500">شما هیچ آگهی ثبت نکرده‌اید.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>عنوان</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>قیمت</TableHead>
                    <TableHead>تعداد بازدید</TableHead>
                    <TableHead>تاریخ ثبت</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ads.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell>{ad.title}</TableCell>
                      <TableCell>{ad.status || '-'}</TableCell>
                      <TableCell>
                        {ad.price !== null && ad.price !== undefined && String(ad.price).trim() !== '' && !isNaN(Number(ad.price))
                          ? Number(ad.price).toLocaleString('fa-IR') + ' تومان'
                          : '—'}
                      </TableCell>
                      <TableCell>{ad.views ?? 0}</TableCell>
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

export default MyAdsPage; 