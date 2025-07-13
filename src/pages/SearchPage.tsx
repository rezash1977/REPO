import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Search as SearchIcon, Filter } from 'lucide-react';
import Header from '../components/layout/Header';
import Navbar from '../components/layout/Navbar';
import SearchBar from '../components/search/SearchBar';
import { useSearch } from '@/hooks/useSearch';
import { useCategories } from '@/hooks/useCategories';
import { formatPrice } from '@/lib/utils';

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' });

  const { data: searchResults, isLoading } = useSearch(query, query.length > 0);
  const { data: categories } = useCategories();

  // Filter results based on selected filters
  const filteredResults = searchResults?.ads.filter(ad => {
    if (selectedCategory && ad.categories.slug !== selectedCategory) {
      return false;
    }
    if (priceRange.min && ad.price && ad.price < parseInt(priceRange.min)) {
      return false;
    }
    if (priceRange.max && ad.price && ad.price > parseInt(priceRange.max)) {
      return false;
    }
    return true;
  }) || [];

  const handleAdClick = (adId: string) => {
    navigate(`/ad/${adId}`);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pb-16 px-4">
        {/* Search Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center mb-4">
            <button 
              onClick={() => navigate('/')}
              className="ml-2"
            >
              <ChevronLeft size={24} className="text-gray-600" />
            </button>
            <h1 className="font-bold text-lg">نتایج جستجو</h1>
          </div>
          
          <SearchBar className="mb-4" />
          
          {query && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                جستجو برای: <span className="font-medium">"{query}"</span>
                {filteredResults.length > 0 && (
                  <span className="mr-2">({filteredResults.length} نتیجه)</span>
                )}
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center text-sm text-blue-600 hover:text-blue-700"
              >
                <Filter size={16} className="ml-1" />
                فیلتر
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">فیلترها</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-700"
              >
                پاک کردن
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">دسته‌بندی</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">همه دسته‌ها</option>
                  {categories?.map(category => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Price Range Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">محدوده قیمت (تومان)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="حداقل"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    className="flex-1 p-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="number"
                    placeholder="حداکثر"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    className="flex-1 p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Suggestions */}
        {searchResults?.suggestedCategories && searchResults.suggestedCategories.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <h3 className="font-medium mb-3">دسته‌بندی‌های مرتبط</h3>
            <div className="flex flex-wrap gap-2">
              {searchResults.suggestedCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => navigate(`/category/${category.slug}`)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">در حال جستجو...</p>
          </div>
        ) : filteredResults.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {filteredResults.map(ad => (
              <div
                key={ad.id}
                onClick={() => handleAdClick(ad.id)}
                className="bg-white rounded-lg shadow-sm p-2 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex gap-2 items-center">
                  {ad.images && ad.images.length > 0 && (
                    <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={ad.images[0]}
                        alt={ad.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-xs mb-0.5 truncate">
                      {ad.title}
                    </h3>
                    {ad.price && (
                      <p className="text-xs font-bold text-green-600 mb-0.5">
                        {formatPrice(ad.price)} تومان
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                      <span>{ad.categories.name}</span>
                      {ad.location && <span>{ad.location}</span>}
                    </div>
                    {ad.description && (
                      <p className="text-[10px] text-gray-600 mt-1 line-clamp-2">
                        {ad.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : query ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <SearchIcon size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              نتیجه‌ای یافت نشد
            </h3>
            <p className="text-gray-600 mb-4">
              برای "{query}" آگهی‌ای پیدا نکردیم
            </p>
            <button
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              بازگشت به صفحه اصلی
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <SearchIcon size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              جستجو کنید
            </h3>
            <p className="text-gray-600">
              کلمه کلیدی مورد نظر خود را وارد کنید
            </p>
          </div>
        )}
      </main>
      
      <Navbar />
    </div>
  );
};

export default SearchPage; 