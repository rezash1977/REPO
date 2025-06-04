import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Phone, MessageSquare } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { supabase } from '@/integrations/supabase/client';

interface AdDetail {
  id: number;
  title: string;
  description: string;
  price: string;
  location: string;
  images: string[];
  date: string;
  sellerName: string;
  sellerJoined: string;
  features: Record<string, string>;
}

const AdDetailPage: React.FC = () => {
  const { adId } = useParams();
  const [ad, setAd] = React.useState<AdDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);

  React.useEffect(() => {
    const fetchAd = async () => {
      setLoading(true);
      setError(null);
      if (!adId) {
        setError('شناسه آگهی نامعتبر است');
        setLoading(false);
        return;
      }
      // فرض: جدول ads دارای فیلدهای title, description, price, location, images, created_at, user_id است
      const { data, error } = await supabase
        .from('ads')
        .select('id, title, description, price, location, images, created_at, user_id')
        .eq('id', adId)
        .single();
      if (error || !data) {
        setError('آگهی مورد نظر یافت نشد');
        setLoading(false);
        return;
      }
      // گرفتن اطلاعات فروشنده (اختیاری)
      let sellerName = '---';
      let sellerJoined = '';
      if (data.user_id) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('full_name, created_at')
          .eq('id', data.user_id)
          .single();
        if (userData) {
          sellerName = userData.full_name || '---';
          sellerJoined = userData.created_at ? `عضویت از ${new Date(userData.created_at).toLocaleDateString('fa-IR')}` : '';
        }
      }
      // ویژگی‌ها (features) را می‌توانید بر اساس نیاز خود بسازید
      const features: Record<string, string> = {};
      // نمونه: اگر فیلدهای بیشتری دارید، اینجا اضافه کنید
      setAd({
        id: Number(data.id),
        title: data.title,
        description: data.description,
        price: data.price ? `${Number(data.price).toLocaleString('fa-IR')} تومان` : 'توافقی',
        location: data.location || '---',
        images: Array.isArray(data.images) ? data.images : [],
        date: data.created_at ? new Date(data.created_at).toLocaleDateString('fa-IR') : '',
        sellerName,
        sellerJoined,
        features,
      });
      setLoading(false);
    };
    fetchAd();
  }, [adId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-gray-500 mb-4">در حال بارگذاری...</p>
        <Navbar />
      </div>
    );
  }

  if (error || !ad) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-gray-500 mb-4">{error || 'آگهی مورد نظر یافت نشد'}</p>
        <Link to="/" className="text-primary font-medium">بازگشت به صفحه اصلی</Link>
        <Navbar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <Link to="/" className="text-gray-500 ml-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform rotate-180">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </Link>
            <h1 className="text-lg font-bold truncate">{ad.title}</h1>
          </div>
        </div>
      </div>
      <main className="container mx-auto px-4 pb-24">
        {/* Image Gallery */}
        {ad.images.length > 0 && (
          <div className="relative bg-black mb-4 rounded-lg overflow-hidden">
            <div className="aspect-w-4 aspect-h-3">
              <img 
                src={ad.images[activeImageIndex]} 
                alt={ad.title} 
                className="w-full h-64 object-cover"
              />
            </div>
            {ad.images.length > 1 && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                <div className="bg-black bg-opacity-50 rounded-full px-3 py-1 flex space-x-1">
                  {ad.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`w-2 h-2 rounded-full ${index === activeImageIndex ? 'bg-white' : 'bg-gray-400'}`}
                    ></button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {/* Ad Info */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h1 className="text-xl font-bold mb-2">{ad.title}</h1>
          <p className="text-primary text-xl font-bold mb-2">{ad.price}</p>
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-500 text-sm">{ad.location}</span>
            <span className="text-gray-400 text-xs">{ad.date}</span>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <h2 className="font-bold mb-2">مشخصات</h2>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(ad.features).length > 0 ? (
                Object.entries(ad.features).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-500 text-sm">{key}:</span>
                    <span className="text-sm">{value}</span>
                  </div>
                ))
              ) : (
                <span className="text-gray-400 text-xs">--- </span>
              )}
            </div>
          </div>
        </div>
        {/* Ad Description */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="font-bold mb-2">توضیحات</h2>
          <p className="text-gray-700 leading-relaxed text-sm">{ad.description}</p>
        </div>
        {/* Seller Info */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="font-bold mb-2">اطلاعات فروشنده</h2>
          <div className="flex items-center">
            <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center">
              <User className="w-6 h-6 text-gray-500" />
            </div>
            <div className="mr-3">
              <div className="font-medium">{ad.sellerName}</div>
              <div className="text-gray-500 text-xs">{ad.sellerJoined}</div>
            </div>
          </div>
        </div>
        {/* Contact Buttons */}
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-2 z-10">
          <div className="container mx-auto flex justify-between">
            <button className="flex-1 bg-primary text-white py-3 rounded-lg flex items-center justify-center ml-2">
              <Phone className="w-5 h-5 ml-1" />
              <span>تماس</span>
            </button>
            <button className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 ml-1" />
              <span>پیام</span>
            </button>
          </div>
        </div>
      </main>
      <Navbar />
    </div>
  );
};

// Adding User icon since it's used in this component
const User = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default AdDetailPage;
