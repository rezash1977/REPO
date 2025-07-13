
import React, { useState, useEffect } from 'react';
import { User, Plus, UserPlus, Settings, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUnreadMessagesCount } from '@/hooks/useUnreadMessagesCount';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const unreadCount = useUnreadMessagesCount(user?.id);

  // Check if user is admin
  useEffect(() => {
    const checkAdminRole = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .single();
          
          if (data && !error) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.log('User is not admin or error checking role:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkAdminRole();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "خروج موفقیت‌آمیز",
        description: "شما با موفقیت از حساب خود خارج شدید",
        variant: "default",
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "خطا در خروج",
        description: "خطایی در خروج از حساب رخ داد",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 z-20 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-around items-center">
          {!user ? (
            <div className="flex space-x-4 space-x-reverse">
              <Link to="/login" className="flex flex-col items-center text-gray-600 hover:text-violet-600">
                <User size={24} className="text-fuchsia-600" />
                <span className="text-xs mt-1">ورود</span>
              </Link>
              
              <Link to="/register" className="flex flex-col items-center text-gray-600 hover:text-violet-600">
                <UserPlus size={24} className="text-violet-600" />
                <span className="text-xs mt-1">ثبت‌نام</span>
              </Link>
            </div>
          ) : (
            <div className="flex space-x-4 space-x-reverse">
              <Link to="/account" className="flex flex-col items-center relative text-gray-600 hover:text-violet-600">
                <User size={24} className="text-fuchsia-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5">
                    {unreadCount}
                  </span>
                )}
                <span className="text-xs mt-1">حساب من</span>
              </Link>
              
              <button 
                onClick={handleSignOut}
                className="flex flex-col items-center text-gray-600 hover:text-violet-600"
              >
                <LogOut size={24} className="text-violet-600" />
                <span className="text-xs mt-1">خروج</span>
              </button>
            </div>
          )}
          
          <Link to="/post-ad" className="flex flex-col items-center">
            <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full p-3 text-white shadow-lg">
              <Plus size={24} />
            </div>
            <span className="text-xs mt-1 text-violet-600 font-medium">ثبت آگهی</span>
          </Link>
          
          <Link to="/" className="flex flex-col items-center text-gray-600 hover:text-violet-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 22V12h6v10M3 9l9-7 9 7v13H3V9z" />
            </svg>
            <span className="text-xs mt-1">خانه</span>
          </Link>
          
          {/* Only show admin panel if user is admin */}
          {isAdmin && (
            <Link to="/admin" className="flex flex-col items-center text-gray-600 hover:text-violet-600">
              <Settings size={24} className="text-primary" />
              <span className="text-xs mt-1">مدیریت</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
