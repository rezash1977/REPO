
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
    <Link to={link} className="w-1/3 px-2 mb-4">
      <div className="category-card shadow-md hover:shadow-lg" style={{ backgroundColor: color }}>
        <div className="text-white">
          {icon}
        </div>
        <span className="mt-2 text-sm font-bold text-white">{name}</span>
      </div>
    </Link>
  );
};

const getIconForCategory = (iconName: string) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    home: <House size={28} />,
    car: <Car size={28} />,
    wrench: <Settings size={28} />,
    smartphone: <Smartphone size={28} />,
    sofa: <Sofa size={28} />,
    briefcase: <Briefcase size={28} />,
  };
  
  return iconMap[iconName] || <House size={28} />;
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
      <div className="container mx-auto px-4 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">دسته‌بندی‌ها</h2>
        </div>
        <div className="flex flex-wrap -mx-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="w-1/3 px-2 mb-4">
              <div className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Error loading categories:', error);
    return (
      <div className="container mx-auto px-4 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">دسته‌بندی‌ها</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-red-500 mb-2">خطا در بارگذاری دسته‌بندی‌ها</p>
          <p className="text-gray-500 text-sm">لطفاً بعداً تلاش کنید</p>
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="container mx-auto px-4 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">دسته‌بندی‌ها</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">هیچ دسته‌بندی‌ای یافت نشد</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-lg">دسته‌بندی‌ها</h2>
        <Link to="/categories" className="text-primary text-sm">مشاهده همه</Link>
      </div>
      
      <div className="flex flex-wrap -mx-2">
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
  );
};

export default CategoryList;
