
import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { House, Car, Settings, Image, MessageSquare, Briefcase } from 'lucide-react';

interface CategoryStepProps {
  category: string | null;
  setCategory: (category: string) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
}

const getIconForCategory = (iconName: string) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    home: <House size={24} />,
    car: <Car size={24} />,
    wrench: <Settings size={24} />,
    smartphone: <MessageSquare size={24} />,
    sofa: <Image size={24} />,
    briefcase: <Briefcase size={24} />,
  };
  
  return iconMap[iconName] || <House size={24} />;
};

const CategoryStep: React.FC<CategoryStepProps> = ({ 
  category, 
  setCategory, 
  goToNextStep,
  goToPrevStep
}) => {
  const { data: categories, isLoading, error } = useCategories();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 animate-fade-in">
        <div className="flex items-center mb-4">
          <button onClick={goToPrevStep} className="ml-2">
            <ChevronLeft size={24} className="text-gray-600" />
          </button>
          <h2 className="font-bold">انتخاب دسته‌بندی</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 animate-fade-in">
        <div className="flex items-center mb-4">
          <button onClick={goToPrevStep} className="ml-2">
            <ChevronLeft size={24} className="text-gray-600" />
          </button>
          <h2 className="font-bold">انتخاب دسته‌بندی</h2>
        </div>
        <p className="text-red-500">خطا در بارگذاری دسته‌بندی‌ها</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 animate-fade-in">
      <div className="flex items-center mb-4">
        <button onClick={goToPrevStep} className="ml-2">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <h2 className="font-bold">انتخاب دسته‌بندی</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-6">
        {categories?.map((cat) => {
          const vibrantColors: { [key: string]: string } = {
            'realestate': '#8B5CF6',
            'cars': '#10B981',
            'services': '#F97316',
            'electronics': '#3B82F6',
            'furniture': '#EC4899',
            'jobs': '#EAB308'
          };
          
          const backgroundColor = vibrantColors[cat.slug] || '#8B5CF6';
          
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.slug)}
              className={`rounded-xl p-3 flex flex-col items-center justify-center h-24 border-2 transition-all shadow-md ${
                category === cat.slug
                  ? 'border-primary bg-opacity-90 scale-105 shadow-lg'
                  : 'border-transparent hover:scale-102 hover:shadow-lg'
              }`}
              style={{ backgroundColor }}
            >
              <div className="mb-2 text-white">
                {getIconForCategory(cat.icon)}
              </div>
              <span className="text-sm font-bold text-white">{cat.name}</span>
            </button>
          );
        })}
      </div>
      
      <button
        onClick={goToNextStep}
        disabled={!category}
        className={`w-full p-3 rounded-lg font-medium ${
          category ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
        }`}
      >
        مرحله بعد
      </button>
    </div>
  );
};

export default CategoryStep;
