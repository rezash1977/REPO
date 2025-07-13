import React from 'react';
import { Link } from 'react-router-dom';
import { House, Car, Settings, Smartphone, Sofa, Briefcase } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';

interface CategoryProps {
  icon: React.ReactNode;
  name: string;
  color: string;
  link: string;
}

const Category: React.FC<CategoryProps> = ({ icon, name, color, link }) => {
  return (
    <Link to={link} className="flex flex-col items-center">
      <div className="category-card-horizontal shadow-md hover:shadow-lg w-20 h-20" style={{ backgroundColor: color }}>
        <div className="text-white">
          {icon}
        </div>
        <span className="mt-1 text-xs font-bold text-white text-center leading-tight">{name}</span>
      </div>
    </Link>
  );
};

const getIconForCategory = (iconName: string) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    home: <House size={20} />,
    car: <Car size={20} />,
    wrench: <Settings size={20} />,
    smartphone: <Smartphone size={20} />,
    sofa: <Sofa size={20} />,
    briefcase: <Briefcase size={20} />,
  };
  
  return iconMap[iconName] || <House size={20} />;
};

const CategoryList: React.FC = () => {
  const { data: categories, isLoading, error } = useCategories();

  // Define vibrant colors for categories
  const getVibrantColor = (slug: string) => {
    const vibrantColors: { [key: string]: string } = {
      'realestate': '#8B5CF6',
      'cars': '#10B981', 
      'services': '#F97316',
      'electronics': '#3B82F6',
      'furniture': '#EC4899',
      'jobs': '#EAB308'
    };
    return vibrantColors[slug] || '#8B5CF6';
  };

  if (isLoading) {
    return (
      <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100 py-3 mb-4">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-hide space-x-3 pb-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Error loading categories:', error);
    return (
      <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100 py-3 mb-4">
        <div className="container mx-auto px-4">
          <div className="text-center py-4">
            <p className="text-red-500 text-sm">خطا در بارگذاری دسته‌بندی‌ها</p>
          </div>
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100 py-3 mb-4">
        <div className="container mx-auto px-4">
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">هیچ دسته‌بندی‌ای یافت نشد</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100 py-3 mb-4">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 pb-2">
          {categories.map((category) => (
            <Category
              key={category.id}
              icon={getIconForCategory(category.icon)}
              name={category.name}
              color={getVibrantColor(category.slug)}
              link={`/category/${category.slug}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryList;
