import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Tag } from 'lucide-react';
import { useSearch, useSearchSuggestions } from '@/hooks/useSearch';
import { useCategories } from '@/hooks/useCategories';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchBarProps {
  onSearchResults?: (results: any) => void;
  placeholder?: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearchResults, 
  placeholder = "دنبال چی می‌گردی؟",
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const { data: searchResults } = useSearch(debouncedSearchTerm, debouncedSearchTerm.length > 0);
  const { data: suggestions } = useSearchSuggestions(debouncedSearchTerm);
  const { data: categories } = useCategories();

  useEffect(() => {
    if (searchResults && onSearchResults) {
      onSearchResults(searchResults);
    }
  }, [searchResults, onSearchResults]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(value.length > 0);
    setSelectedIndex(-1);
  };

  const handleInputFocus = () => {
    if (searchTerm.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleSearch = (term: string = searchTerm) => {
    if (term.trim()) {
      navigate(`/search?q=${encodeURIComponent(term.trim())}`);
      setShowSuggestions(false);
      searchInputRef.current?.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    const allSuggestions = [
      ...(suggestions || []),
      ...(searchResults?.suggestedCategories || [])
    ];

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < allSuggestions.length) {
          const selected = allSuggestions[selectedIndex];
          if (typeof selected === 'string') {
            handleSearch(selected);
          } else {
            navigate(`/category/${selected.slug}`);
          }
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    searchInputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: string | any) => {
    if (typeof suggestion === 'string') {
      handleSearch(suggestion);
    } else {
      navigate(`/category/${suggestion.slug}`);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={searchInputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="search-bar w-full pr-12 pl-10"
        />
        
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <Search 
            className="h-5 w-5 text-red-500 cursor-pointer" 
            onClick={() => handleSearch()}
          />
        </div>
        
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 left-0 pl-3 flex items-center"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {showSuggestions && (searchTerm.length > 0) && (
        <div 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1 max-h-80 overflow-y-auto"
        >
          {/* Search suggestions */}
          {suggestions && suggestions.length > 0 && (
            <div className="p-2">
              <div className="text-xs text-gray-500 mb-2 px-2">پیشنهادات جستجو</div>
              {suggestions.map((suggestion, index) => (
                <div
                  key={`suggestion-${index}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`flex items-center px-3 py-2 cursor-pointer rounded-md ${
                    selectedIndex === index ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <Search className="h-4 w-4 text-gray-400 ml-2" />
                  <span className="text-sm">{suggestion}</span>
                </div>
              ))}
            </div>
          )}

          {/* Category suggestions */}
          {searchResults?.suggestedCategories && searchResults.suggestedCategories.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <div className="text-xs text-gray-500 mb-2 px-2">دسته‌بندی‌های مرتبط</div>
              {searchResults.suggestedCategories.map((category, index) => (
                <div
                  key={`category-${category.id}`}
                  onClick={() => handleSuggestionClick(category)}
                  className={`flex items-center px-3 py-2 cursor-pointer rounded-md ${
                    selectedIndex === (suggestions?.length || 0) + index ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <Tag className="h-4 w-4 text-gray-400 ml-2" />
                  <span className="text-sm">{category.name}</span>
                  <span className="text-xs text-gray-400 mr-auto">دسته‌بندی</span>
                </div>
              ))}
            </div>
          )}

          {/* No results */}
          {searchTerm.length > 2 && 
           (!suggestions || suggestions.length === 0) && 
           (!searchResults?.suggestedCategories || searchResults.suggestedCategories.length === 0) && (
            <div className="p-4 text-center text-gray-500 text-sm">
              نتیجه‌ای یافت نشد
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar; 