// AccountPage.tsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, User, Settings, ArrowDown } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import ChatModule from '../components/chat/ChatModule';

const AccountPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [fullName, setFullName] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string>('');
  const [editNickname, setEditNickname] = useState<string>('');
  const [savingNickname, setSavingNickname] = useState<boolean>(false);

  // 1. fetch اولیه‌ی پروفایل
  useEffect(() => {
    if (!user) return;
    (async () => {
      // @ts-expect-error: Supabase types may not include nickname
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, nickname')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setFullName(null);
        setNickname('');
        setEditNickname('');
      } else {
        // @ts-expect-error: Supabase types may not include nickname
        setFullName(data.full_name || null);
        // @ts-expect-error: Supabase types may not include nickname
        setNickname(data.nickname || '');
        // @ts-expect-error: Supabase types may not include nickname
        setEditNickname(data.nickname || '');
      }
    })();
  }, [user]);

  // 2. ذخیره‌ی اسم مستعار با update → در صورت نبودن رکورد، insert
  const handleSaveNickname = async () => {
    if (!user) return;

    const newNick = editNickname.trim();
    if (!newNick) {
      toast({ title: 'اسم مستعار نمی‌تواند خالی باشد', variant: 'destructive' });
      return;
    }
    if (newNick === nickname) {
      toast({ title: 'اسم مستعار تغییری نکرده است', variant: 'destructive' });
      return;
    }

    setSavingNickname(true);
    try {
      // الف) تلاش برای update
      // @ts-expect-error: Supabase types may not include nickname
      const { data: updatedRows, error: updateError } = await supabase
        .from('profiles')
        .update({ nickname: newNick })
        .eq('id', user.id)
        .select('id, nickname');

      if (updateError) {
        throw updateError;
      }

      // اگر هیچ ردیفی به‌روز نشده باشد، insert می‌کنیم
      if (!updatedRows || (Array.isArray(updatedRows) && updatedRows.length === 0)) {
        // @ts-expect-error: Supabase types may not include nickname
        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .insert({ id: user.id, nickname: newNick })
          .select('nickname')
          .single();

        if (insertError) {
          throw insertError;
        }
        // @ts-expect-error: Supabase types may not include nickname
        setNickname(inserted.nickname);
        // @ts-expect-error: Supabase types may not include nickname
        setEditNickname(inserted.nickname);
      } else {
        // update موفق
        // @ts-expect-error: Supabase types may not include nickname
        const updatedNick = updatedRows[0]?.nickname;
        setNickname(updatedNick);
        setEditNickname(updatedNick);
      }

      toast({ title: 'اسم مستعار با موفقیت ذخیره شد', variant: 'default' });
    } catch (err: any) {
      console.error('Error saving nickname:', err);
      toast({ title: 'خطا در ذخیره اسم مستعار', variant: 'destructive' });
    } finally {
      setSavingNickname(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* هدر */}
      <div className="bg-primary text-white">
        <div className="container mx-auto px-4 py-6 flex items-center">
          <div className="bg-white bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <div className="mr-3">
            <p className="font-bold text-lg">
              {fullName || user?.email || 'کاربر چی‌کو'}
            </p>
            {user?.email && (
              <p className="text-sm text-white text-opacity-80">{user.email}</p>
            )}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-4 pb-20">
        {/* آگهی‌ها */}
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="#ea384c"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
                </svg>
              </div>
              <span>آگهی‌های نشان شده</span>
            </div>
            <ArrowDown className="w-4 h-4 transform -rotate-90 text-gray-400" />
          </Link>
        </div>

        {/* ماژول چت */}
        <ChatModule user={user} toast={toast} />

        {/* تنظیمات */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold">تنظیمات</h2>
          </div>

          {/* ویرایش اسم مستعار */}
          <div className="p-4 border-b border-gray-100">
            <label className="block mb-1 text-sm font-medium">
              اسم مستعار برای چت
            </label>
            <input
              type="text"
              className="border rounded p-2 w-full mb-2"
              value={editNickname}
              onChange={e => setEditNickname(e.target.value)}
              placeholder="مثلاً: کاربر خوش‌ذوق"
              disabled={savingNickname}
              maxLength={32}
            />
            <button
              type="button"
              className="bg-primary text-white px-4 py-2 rounded"
              onClick={handleSaveNickname}
              disabled={savingNickname || !editNickname.trim()}
            >
              {savingNickname ? 'در حال ذخیره...' : 'ذخیره اسم مستعار'}
            </button>
            {nickname && (
              <div className="text-xs text-green-600 mt-2">
                اسم مستعار فعلی: {nickname}
              </div>
            )}
          </div>

          {/* لینک‌های دیگر */}
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

          {/* خروج */}
          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              try {
                await signOut();
                toast({ title: 'خروج موفقیت‌آمیز بود', variant: 'default' });
                navigate('/login');
              } catch (error: any) {
                console.error('Sign out error:', error);
                toast({
                  title: 'خطا در خروج از حساب کاربری',
                  description: error?.message || 'مشکلی پیش آمد.',
                  variant: 'destructive',
                });
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
