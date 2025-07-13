import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { formatPrice } from '@/lib/utils';

interface AdCardProps {
  id: string;
  title: string;
  price: number | null;
  location: string | null;
  imageUrl: string;
  description: string | null;
  categoryName: string;
  showFavoriteButton?: boolean;
  className?: string;
}

const AdCard: React.FC<AdCardProps> = ({ 
  id, 
  title, 
  price, 
  location, 
  imageUrl, 
  description, 
  categoryName,
  showFavoriteButton = true,
  className = ""
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: 'برای نشان کردن آگهی ابتدا وارد شوید',
        variant: 'destructive'
      });
      return;
    }

    const success = await toggleFavorite(id);
    if (success) {
      toast({
        title: isFavorite(id) 
          ? 'آگهی از نشان شده‌ها حذف شد' 
          : 'آگهی به نشان شده‌ها اضافه شد',
        variant: 'default'
      });
    } else {
      toast({
        title: 'خطا در تغییر وضعیت نشان کردن',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className={`relative bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow animate-fade-in ${className}`}>
      <Link to={`/ad/${id}`} className="flex items-center">
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
      
      {showFavoriteButton && (
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-2 left-2 p-1.5 rounded-full transition-all ${
            isFavorite(id)
              ? 'bg-red-500 text-white shadow-md'
              : 'bg-white/80 text-gray-600 hover:bg-red-500 hover:text-white'
          }`}
        >
          <Heart className={`w-3 h-3 ${isFavorite(id) ? 'fill-current' : ''}`} />
        </button>
      )}
    </div>
  );
};

export default AdCard; 