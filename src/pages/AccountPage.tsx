import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Settings, MessageSquare, ArrowDown } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

const AccountPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fullName, setFullName] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        if (data && data.full_name) {
          setFullName(data.full_name);
        } else {
          setFullName(null);
        }
      }
    };
    fetchProfile();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center">
            <div className="bg-white bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
            <div className="mr-3">
              <p className="font-bold text-lg">{fullName || user?.email || 'کاربر چی کو'}</p>
              {user?.email && (
                <p className="text-sm text-white text-opacity-80">{user.email}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-4 pb-20">
        <div className="bg-white rounded-lg shadow-sm mb-4">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold">آگهی‌های من</h2>
          </div>
          
          <Link to="/my-ads" className="flex items-center justify-between p-4 hover:bg-gray-50">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-2 ml-3">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <span>آگهی‌های فعال</span>
            </div>
            <ArrowDown className="w-4 h-4 transform -rotate-90 text-gray-400" />
          </Link>
          
          <Link to="/favorites" className="flex items-center justify-between p-4 hover:bg-gray-50">
            <div className="flex items-center">
              <div className="rounded-full bg-red-100 p-2 ml-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea384c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
                </svg>
              </div>
              <span>آگهی‌های نشان شده</span>
            </div>
            <ArrowDown className="w-4 h-4 transform -rotate-90 text-gray-400" />
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold">تنظیمات</h2>
          </div>
          
          <Link to="/settings/profile" className="flex items-center justify-between p-4 hover:bg-gray-50">
            <div className="flex items-center">
              <div className="rounded-full bg-gray-100 p-2 ml-3">
                <User className="w-5 h-5 text-violet-600" />
              </div>
              <span>اطلاعات حساب کاربری</span>
            </div>
            <ArrowDown className="w-4 h-4 transform -rotate-90 text-gray-400" />
          </Link>
          
          <Link to="/settings/app" className="flex items-center justify-between p-4 hover:bg-gray-50">
            <div className="flex items-center">
              <div className="rounded-full bg-gray-100 p-2 ml-3">
                <Settings className="w-5 h-5 text-green-500" />
              </div>
              <span>تنظیمات برنامه</span>
            </div>
            <ArrowDown className="w-4 h-4 transform -rotate-90 text-gray-400" />
          </Link>
          
          <Link to="/support" className="flex items-center justify-between p-4 hover:bg-gray-50">
            <div className="flex items-center">
              <div className="rounded-full bg-gray-100 p-2 ml-3">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <span>پشتیبانی و تماس با ما</span>
            </div>
            <ArrowDown className="w-4 h-4 transform -rotate-90 text-gray-400" />
          </Link>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              try {
                await signOut();
                toast({ title: "خروج موفقیت‌آمیز بود" });
                navigate("/login");
              } catch (error) {
                toast({ title: "خطا در خروج از حساب کاربری", description: error?.message || "مشکلی پیش آمد." });
              }
            }}
          >
            خروج از حساب کاربری
          </Button>
        </div>
      </main>
      
      <Navbar />
    </div>
  );
};

export default AccountPage;
