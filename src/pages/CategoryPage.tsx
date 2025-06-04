
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useAds } from '@/hooks/useAds';
import Header from '../components/layout/Header';
import Navbar from '../components/layout/Navbar';

interface AdProps {
  id: string;
  title: string;
  price: number | null;
  location: string | null;
  images: string[];
  created_at: string;
}

const AdItem: React.FC<AdProps> = ({ id, title, price, location, images, created_at }) => {
  const formatPrice = (price: number | null) => {
    if (!price) return 'توافقی';
    return `${price.toLocaleString('fa-IR')} تومان`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'امروز';
    if (diffDays === 2) return 'دیروز';
    return `${diffDays} روز پیش`;
  };

  const imageUrl = images && images.length > 0 
    ? images[0] 
    : 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop';

  return (
    <Link to={`/ad/${id}`} className="flex border-b border-gray-100 py-3 animate-fade-in">
      <div className="w-24 h-24 rounded-md overflow-hidden">
        <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 pr-3">
        <h3 className="font-medium text-sm mb-1">{title}</h3>
        <p className="text-primary font-bold text-sm">{formatPrice(price)}</p>
        <div className="flex justify-between mt-2">
          <span className="text-gray-500 text-xs">{location || 'موقعیت نامشخص'}</span>
          <span className="text-gray-400 text-xs">{formatDate(created_at)}</span>
        </div>
      </div>
    </Link>
  );
};

const CategoryPage: React.FC = () => {
  const { categoryId } = useParams();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: ads, isLoading: adsLoading, error: adsError } = useAds(categoryId);
  
  const [sortOpen, setSortOpen] = React.useState(false);
  const [sortBy, setSortBy] = React.useState('جدیدترین');
  
  // Find the current category
  const currentCategory = categories?.find(cat => cat.slug === categoryId);
  
  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 pb-24 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentCategory) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 pb-24 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-500">دسته‌بندی یافت نشد</p>
            <Link to="/" className="text-primary mt-2 inline-block">بازگشت به صفحه اصلی</Link>
          </div>
        </div>
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
            <h1 className="text-xl font-bold" style={{ color: currentCategory.color }}>
              {currentCategory.name}
            </h1>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-4 bg-white shadow-sm mb-4">
        <div className="relative">
          <button 
            onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center justify-between w-full p-2 border border-gray-200 rounded-lg"
          >
            <span className="text-sm">مرتب‌سازی: {sortBy}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {sortOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {['جدیدترین', 'ارزان‌ترین', 'گران‌ترین'].map((option) => (
                <button
                  key={option}
                  className="block w-full text-right px-4 py-2 text-sm hover:bg-gray-50"
                  onClick={() => {
                    setSortBy(option);
                    setSortOpen(false);
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <main className="container mx-auto px-4 pb-16">
        <div className="bg-white rounded-lg shadow-sm p-4">
          {adsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex border-b border-gray-100 py-3">
                  <div className="w-24 h-24 rounded-md bg-gray-200 animate-pulse"></div>
                  <div className="flex-1 pr-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : adsError ? (
            <div className="text-center py-10">
              <p className="text-red-500">خطا در بارگذاری آگهی‌ها</p>
            </div>
          ) : ads && ads.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {ads.map((ad) => (
                <AdItem
                  key={ad.id}
                  id={ad.id}
                  title={ad.title}
                  price={ad.price}
                  location={ad.location}
                  images={ad.images || []}
                  created_at={ad.created_at}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">آگهی‌ای در این دسته‌بندی یافت نشد</p>
              <Link to="/post-ad" className="text-primary mt-2 inline-block">اولین آگهی را ثبت کنید</Link>
            </div>
          )}
        </div>
      </main>
      
      <Navbar />
    </div>
  );
};

export default CategoryPage;
