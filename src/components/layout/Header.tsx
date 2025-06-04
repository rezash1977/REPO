
import React from 'react';
import { Search } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white py-4 mb-6 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-violet-600">چی کو</h1>
          <div className="text-sm text-gray-500">
            <span className="inline-flex items-center bg-blue-100 text-blue-700 font-bold text-xs px-2 py-1 rounded-full">
              هوشمند
            </span>
          </div>
        </div>
        
        <div className="relative">
          <input 
            type="text" 
            placeholder="دنبال چی می‌گردی؟" 
            className="search-bar w-full"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-red-500" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
