import React from 'react';
import { useAds } from '@/hooks/useAds';
import AdCard from '@/components/ui/AdCard';

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
