import React from 'react';
import { Link } from 'react-router-dom';
import { useAds } from '@/hooks/useAds';

interface AdProps {
  id: string;
  title: string;
  price: number | null;
  location: string | null;
  imageUrl: string;
}

const AdCard: React.FC<AdProps> = ({ id, title, price, location, imageUrl }) => {
  const formatPrice = (price: number | null) => {
    if (!price) return 'توافقی';
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  return (
    <Link to={`/ad/${id}`} className="w-full rounded-lg overflow-hidden shadow-sm border border-gray-100 mb-4 bg-white animate-fade-in">
      <div className="relative h-48">
        <img 
          src={imageUrl || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43'} 
          alt={title} 
          className="w-full h-full object-cover" 
        />
      </div>
      <div className="p-3">
        <h3 className="font-medium text-base mb-1 truncate">{title}</h3>
        <p className="text-primary font-bold">{formatPrice(price)}</p>
        <p className="text-gray-500 text-xs mt-1">{location || 'موقعیت نامشخص'}</p>
      </div>
    </Link>
  );
};

const FeaturedAds: React.FC = () => {
  const { data: ads, isLoading, error } = useAds();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 mb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="w-full rounded-lg bg-gray-200 h-64 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Error loading ads:', error);
    return (
      <div className="container mx-auto px-4 mb-20">
        <p className="text-red-500">خطا در بارگذاری آگهی‌ها</p>
      </div>
    );
  }

  const featuredAds = ads || [];

  return (
    <div className="container mx-auto px-4 mb-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {featuredAds.length > 0 ? (
          featuredAds.map((ad) => (
            <AdCard
              key={ad.id}
              id={ad.id}
              title={ad.title}
              price={ad.price}
              location={ad.location}
              imageUrl={ad.images?.[0] || ''}
            />
          ))
        ) : (
          <div className="col-span-4 text-center py-8">
            <p className="text-gray-500">هنوز آگهی‌ای ثبت نشده است</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedAds;
