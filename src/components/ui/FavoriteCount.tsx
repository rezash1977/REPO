import React from 'react';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';

interface FavoriteCountProps {
  className?: string;
}

const FavoriteCount: React.FC<FavoriteCountProps> = ({ className = "" }) => {
  const { favorites } = useFavorites();

  if (favorites.length === 0) return null;

  return (
    <div className={`relative ${className}`}>
      <Heart className="w-5 h-5 text-red-500" />
      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
        {favorites.length > 99 ? '99+' : favorites.length}
      </span>
    </div>
  );
};

export default FavoriteCount; 