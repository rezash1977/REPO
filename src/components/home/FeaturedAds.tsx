import React from 'react';
import { Link } from 'react-router-dom';
import { useAds } from '@/hooks/useAds';
import { formatPrice } from '@/lib/utils';

interface AdProps {
  id: string;
  title: string;
  price: number | null;
  location: string | null;
  imageUrl: string;
  description: string | null;
  categoryName: string;
}

const AdCard: React.FC<AdProps> = ({ id, title, price, location, imageUrl, description, categoryName }) => {
  return (
    <Link to={`/ad/${id}`} className="flex bg-white rounded-lg shadow-sm border border-gray-100 mb-2 overflow-hidden hover:shadow-md transition-shadow animate-fade-in items-center">
      <div className="w-16 h-16 flex-shrink-0">
        <img 
          src={imageUrl || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43'} 
          alt={title} 
          className="w-full h-full object-cover" 
        />
      </div>
      <div className="flex-1 p-2 min-w-0">
        <h3 className="font-medium text-xs mb-0.5 truncate">{title}</h3>
        {price && (
          <p className="text-green-600 font-bold text-xs mb-0.5">{formatPrice(price)} تومان</p>
        )}
        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
          <span>{categoryName}</span>
          {location && <span>{location}</span>}
        </div>
        {description && (
          <p className="text-[10px] text-gray-600 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </Link>
  );
};

const FeaturedAds: React.FC = () => {
  const { data: ads, isLoading, error } = useAds();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 mb-20">
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex bg-gray-200 rounded-lg h-24 animate-pulse"></div>
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
      <div className="mb-4">
        <h2 className="font-bold text-lg">آگهی‌های ویژه</h2>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {featuredAds.length > 0 ? (
          featuredAds.map((ad) => (
            <AdCard
              key={ad.id}
              id={ad.id}
              title={ad.title}
              price={ad.price}
              location={ad.location}
              imageUrl={ad.images?.[0] || ''}
              description={ad.description}
              categoryName={ad.categories?.name || 'دسته‌بندی نامشخص'}
            />
          ))
        ) : (
          <div className="text-center py-8 col-span-4">
            <p className="text-gray-500">هنوز آگهی‌ای ثبت نشده است</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedAds;
