import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Phone, MessageSquare, Heart } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ChatModule from '../components/chat/ChatModule';
import { useToast } from '@/components/ui/use-toast';
import { useFavorites } from '@/hooks/useFavorites';

// پیام به فروشنده - ساختار جدول پیشنهادی در Supabase:
//
// create table public.messages (
//   id uuid primary key default uuid_generate_v4(),
//   ad_id uuid not null,
//   sender_id uuid not null,
//   receiver_id uuid not null,
//   content text not null,
//   created_at timestamp with time zone default now()
// );
//
// اگر ad_id از نوع int است، نوع آن را به int تغییر دهید.
//
// ---

interface AdDetail {
  id: number;
  title: string;
  description: string;
  price: string;
  location: string;
  images: string[];
  date: string;
  sellerName: string;
  sellerJoined: string;
  features: Record<string, string>;
  sellerId?: string; // اضافه شد
}

const AdDetailPage: React.FC = () => {
  const { adId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ad, setAd] = React.useState<AdDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [showMessageModal, setShowMessageModal] = React.useState(false);
  const [messageText, setMessageText] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [messageSuccess, setMessageSuccess] = React.useState(false);
  const [messageError, setMessageError] = React.useState('');
  const { toast } = useToast();
  const [showChat, setShowChat] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();

  React.useEffect(() => {
    const fetchAd = async () => {
      setLoading(true);
      setError(null);
      if (!adId) {
        setError('شناسه آگهی نامعتبر است');
        setLoading(false);
        return;
      }
      // فرض: جدول ads دارای فیلدهای title, description, price, location, images, created_at, user_id است
      const { data, error } = await supabase
        .from('ads')
        .select('id, title, description, price, location, images, created_at, user_id')
        .eq('id', adId)
        .single();
      if (error || !data) {
        setError('آگهی مورد نظر یافت نشد');
        setLoading(false);
        return;
      }
      let sellerName = '---';
      let sellerJoined = '';
      if (data.user_id) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('full_name, created_at')
          .eq('id', data.user_id)
          .single();
        if (userData) {
          sellerName = userData.full_name || '---';
          sellerJoined = userData.created_at ? `عضویت از ${new Date(userData.created_at).toLocaleDateString('fa-IR')}` : '';
        }
      }
      const features: Record<string, string> = {};
      setAd({
        id: data.id, // uuid string, not number!
        title: data.title,
        description: data.description,
        price: data.price ? `${Number(data.price).toLocaleString('fa-IR')} تومان` : 'توافقی',
        location: data.location || '---',
        images: Array.isArray(data.images) ? data.images : [],
        date: data.created_at ? new Date(data.created_at).toLocaleDateString('fa-IR') : '',
        sellerName,
        sellerJoined,
        features,
        sellerId: data.user_id, // اضافه شد
      });
      setLoading(false);
    };
    fetchAd();
  }, [adId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-gray-500 mb-4">در حال بارگذاری...</p>
        <Navbar />
      </div>
    );
  }

  if (error || !ad) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-gray-500 mb-4">{error || 'آگهی مورد نظر یافت نشد'}</p>
        <Link to="/" className="text-primary font-medium">بازگشت به صفحه اصلی</Link>
        <Navbar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <Link to="/" className="text-gray-500 ml-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform rotate-180">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </Link>
            <h1 className="text-lg font-bold truncate">{ad.title}</h1>
          </div>
        </div>
      </div>
      <main className="container mx-auto px-4 pb-24">
        {/* Ad Thumbnail and Info Row */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex items-center gap-4">
          {ad.images.length > 0 && (
            <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={ad.images[0]}
                alt={ad.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold mb-1 truncate">{ad.title}</h1>
            <p className="text-primary text-lg font-bold mb-1">{ad.price}</p>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-500 text-sm">{ad.location}</span>
              <span className="text-gray-400 text-xs">{ad.date}</span>
            </div>
          </div>
        </div>
        {/* Image Gallery (if more images) */}
        {ad.images.length > 1 && (
          <div className="relative bg-black mb-4 rounded-lg overflow-hidden">
            <div className="aspect-w-4 aspect-h-3">
              <img 
                src={ad.images[activeImageIndex]} 
                alt={ad.title} 
                className="w-full h-64 object-cover"
              />
            </div>
            <div className="absolute bottom-2 left-0 right-0 flex justify-center">
              <div className="bg-black bg-opacity-50 rounded-full px-3 py-1 flex space-x-1">
                {ad.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`w-2 h-2 rounded-full ${index === activeImageIndex ? 'bg-white' : 'bg-gray-400'}`}
                  ></button>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Ad Description */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="font-bold mb-2">توضیحات</h2>
          <p className="text-gray-700 leading-relaxed text-sm">{ad.description}</p>
        </div>
        {/* Seller Info */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="font-bold mb-2">اطلاعات فروشنده</h2>
          <div className="flex items-center">
            <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center">
              <User className="w-6 h-6 text-gray-500" />
            </div>
            <div className="mr-3">
              <div className="font-medium">{ad.sellerName}</div>
              <div className="text-gray-500 text-xs">{ad.sellerJoined}</div>
            </div>
          </div>
        </div>
        {/* Contact Buttons */}
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-2 z-10">
          <div className="container mx-auto flex justify-between">
            <button className="flex-1 bg-primary text-white py-3 rounded-lg flex items-center justify-center ml-2">
              <Phone className="w-5 h-5 ml-1" />
              <span>تماس</span>
            </button>
            <button
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg flex items-center justify-center"
              onClick={() => {
                if (!user) {
                  navigate('/login');
                } else {
                  setShowMessageModal(true);
                }
              }}
            >
              <MessageSquare className="w-5 h-5 ml-1" />
              <span>پیام</span>
            </button>
            <button
              className={`flex-1 py-3 rounded-lg flex items-center justify-center mr-2 ${
                isFavorite(ad.id.toString())
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-700'
              }`}
              onClick={async () => {
                if (!user) {
                  navigate('/login');
                  return;
                }
                const success = await toggleFavorite(ad.id.toString());
                if (success) {
                  toast({
                    title: isFavorite(ad.id.toString()) 
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
              }}
            >
              <Heart className={`w-5 h-5 ml-1 ${isFavorite(ad.id.toString()) ? 'fill-current' : ''}`} />
              <span>نشان</span>
            </button>
          </div>
        </div>
        {/* Message Modal (active) */}
        {showMessageModal && user && ad && ad.sellerId && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
              <h3 className="font-bold mb-2">ارسال پیام به فروشنده</h3>
              <textarea
                className="w-full border rounded p-2 mb-4"
                rows={4}
                placeholder="متن پیام شما..."
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                disabled={sending || messageSuccess}
              ></textarea>
              {messageError && <div className="text-red-500 text-xs mb-2">{messageError}</div>}
              {messageSuccess && <div className="text-green-600 text-xs mb-2">پیام با موفقیت ارسال شد.</div>}
              <div className="flex justify-end gap-2">
                <button className="px-4 py-2 rounded bg-gray-200" onClick={() => {
                  setShowMessageModal(false);
                  setMessageText('');
                  setMessageSuccess(false);
                  setMessageError('');
                }}>بستن</button>
                <button
                  className="px-4 py-2 rounded bg-primary text-white disabled:opacity-50"
                  disabled={!messageText.trim() || sending || messageSuccess}
                  onClick={async () => {
                    setSending(true);
                    setMessageError('');
                    try {
                      const { error } = await supabase
                        .from('messages')
                        .insert({
                          ad_id: ad.id.toString(),
                          sender_id: user.id,
                          receiver_id: ad.sellerId,
                          content: messageText.trim(),
                        });
                      if (error) {
                        setMessageError('خطا در ارسال پیام.');
                      } else {
                        setMessageSuccess(true);
                      }
                    } catch (err) {
                      setMessageError('خطای غیرمنتظره.');
                    } finally {
                      setSending(false);
                    }
                  }}
                >{sending ? 'در حال ارسال...' : 'ارسال'}</button>
              </div>
            </div>
          </div>
        )}
        {showChat && (
          <ChatModule
            user={user}
            toast={toast}
            initialAdId={ad.id.toString()}
            initialReceiverId={ad.sellerId}
            onClose={() => setShowChat(false)}
          />
        )}
      </main>
      <Navbar />
    </div>
  );
};

// Adding User icon since it's used in this component
const User = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default AdDetailPage;
