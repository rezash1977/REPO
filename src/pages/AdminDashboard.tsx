import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Settings, Users, Database, Archive, MessageSquare } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  const [users, setUsers] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAds: 0,
    activeAds: 0,
    pendingAds: 0,
    categories: 0,
    todayVisits: 0,
    monthlyVisits: 0,
  });

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', city: '' });

  const [selectedAds, setSelectedAds] = useState<string[]>([]);
  const [allConversations, setAllConversations] = useState<any[]>([]);
  const [adminSelectedChat, setAdminSelectedChat] = useState<{ad_id: string, user1: string, user2: string, adTitle?: string, user1Name?: string, user2Name?: string} | null>(null);
  const [adminChatMessages, setAdminChatMessages] = useState<any[]>([]);
  const [adminChatLoading, setAdminChatLoading] = useState(false);
  const [chatFilter, setChatFilter] = useState('');
  const [adminUserMap, setAdminUserMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setChecking(false);
      setIsAdmin(false);
      return;
    }
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()
      .then(({ data, error }) => {
        setIsAdmin(!!data && !error);
        setChecking(false);
      });
  }, [user, loading]);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .then(({ data, error }) => {
        if (!error && data) setUsers(data);
      });

    supabase
      .from('ads')
      .select('*')
      .then(({ data, error }) => {
        if (!error && data) setAds(data);
      });

    const fetchStats = async () => {
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: totalAds } = await supabase
        .from('ads')
        .select('*', { count: 'exact', head: true });

      const { count: activeAds } = await supabase
        .from('ads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'فعال');

      const { count: pendingAds } = await supabase
        .from('ads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'در انتظار تایید');

      const { count: categories } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: totalUsers || 0,
        totalAds: totalAds || 0,
        activeAds: activeAds || 0,
        pendingAds: pendingAds || 0,
        categories: categories || 0,
        todayVisits: 0,
        monthlyVisits: 0,
      });
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const fetchAllConversations = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('ad_id, sender_id, receiver_id')
        .order('created_at', { ascending: false });
      if (!error && data) {
        // استخراج مکالمات یکتا (ad_id + دو کاربر)
        const convMap = new Map();
        data.forEach(msg => {
          // ترتیب user1/user2 را ثابت نگه داریم (کوچک‌تر اول)
          const users = [msg.sender_id, msg.receiver_id].sort();
          const key = msg.ad_id + '-' + users[0] + '-' + users[1];
          if (!convMap.has(key)) {
            convMap.set(key, {
              ad_id: msg.ad_id,
              adTitle: `آگهی ${msg.ad_id}`,
              user1: users[0],
              user2: users[1],
              user1Name: users[0],
              user2Name: users[1],
            });
          }
        });
        // حالا اطلاعات کاربران و آگهی‌ها را جداگانه دریافت می‌کنیم
        const userIds = Array.from(new Set(data.flatMap(msg => [msg.sender_id, msg.receiver_id])));
        const adIds = Array.from(new Set(data.map(msg => msg.ad_id)));
        // دریافت اطلاعات کاربران
        if (userIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from('profiles')
            .select('id, full_name, nickname')
            .in('id', userIds);
          if (usersData && Array.isArray(usersData) && !usersError) {
            const userMap = new Map(
              usersData
                .filter(u => u && typeof u === 'object' && 'id' in u)
                .map(u => [u.id, (u.nickname || u.full_name || u.id)])
            );
            convMap.forEach(conv => {
              conv.user1Name = userMap.get(conv.user1) || conv.user1;
              conv.user2Name = userMap.get(conv.user2) || conv.user2;
            });
          }
        }
        // دریافت اطلاعات آگهی‌ها
        if (adIds.length > 0) {
          const { data: adsData, error: adsError } = await supabase
            .from('ads')
            .select('id, title')
            .in('id', adIds);
          if (adsData && !adsError) {
            const adMap = new Map(adsData.map(ad => [ad.id, ad.title || `آگهی ${ad.id}`]));
            convMap.forEach(conv => {
              conv.adTitle = adMap.get(conv.ad_id) || `آگهی ${conv.ad_id}`;
            });
          }
        }
        setAllConversations(Array.from(convMap.values()));
      } else {
        setAllConversations([]);
      }
    };
    fetchAllConversations();
  }, []);

  // تابع واکشی پیام‌های چت ادمین (برای استفاده مجدد)
  const fetchAdminChatMessages = async () => {
    if (!adminSelectedChat) return;
    setAdminChatLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('ad_id', adminSelectedChat.ad_id)
      .in('sender_id', [adminSelectedChat.user1, adminSelectedChat.user2])
      .in('receiver_id', [adminSelectedChat.user1, adminSelectedChat.user2])
      .order('created_at', { ascending: true });
    if (!error && data) {
      setAdminChatMessages(data);
      // دریافت نام کاربران این گفتگو
      const userIds = Array.from(new Set(data.map(msg => msg.sender_id)));
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('profiles')
          .select('id, nickname, full_name')
          .in('id', userIds);
        if (usersData && Array.isArray(usersData)) {
          const map: Record<string, string> = {};
          usersData.forEach((u: any) => {
            if (u && typeof u === 'object' && 'id' in u) {
              map[u.id] = u.nickname || u.full_name || u.id;
            }
          });
          setAdminUserMap(map);
        }
      }
    } else {
      setAdminChatMessages([]);
      setAdminUserMap({});
    }
    setAdminChatLoading(false);
  };

  useEffect(() => {
    fetchAdminChatMessages();
  }, [adminSelectedChat]);

  // اضافه کردن پیام جدید به صورت real-time فقط به انتهای state
  useEffect(() => {
    if (!adminSelectedChat) return;
    const channel = supabase
      .channel('admin-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.new;
        if (
          msg.ad_id === adminSelectedChat.ad_id &&
          [adminSelectedChat.user1, adminSelectedChat.user2].includes(msg.sender_id) &&
          [adminSelectedChat.user1, adminSelectedChat.user2].includes(msg.receiver_id)
        ) {
          setAdminChatMessages(prev => {
            // اگر پیام تکراری نبود اضافه کن
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [adminSelectedChat]);

  const handleApproveAd = async (adId: string) => {
    const { error } = await supabase
      .from('ads')
      .update({ status: 'active' })
      .eq('id', adId);
    if (!error) {
      setAds((prev) => prev.map((ad) => ad.id === adId ? { ...ad, status: 'فعال' } : ad));
      toast({ title: 'آگهی تایید شد', variant: 'default' });
    } else {
      console.error('Supabase error:', error);
      toast({ title: 'خطا در تایید آگهی', description: error.message, variant: 'destructive' });
    }
  };

  const handleRejectAd = async (adId: string) => {
    const { error } = await supabase
      .from('ads')
      .update({ status: 'rejected' })
      .eq('id', adId);
    if (!error) {
      setAds((prev) => prev.map((ad) => ad.id === adId ? { ...ad, status: 'رد شده' } : ad));
      toast({ title: 'آگهی رد شد', variant: 'default' });
    } else {
      toast({ title: 'خطا در رد آگهی', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteAd = async (adId: string, adImages: string[]) => {
    const confirmed = window.confirm('آیا از حذف این آگهی مطمئن هستید؟ این عملیات غیرقابل بازگشت است و تصاویر نیز حذف خواهند شد.');
    if (!confirmed) return;

    // حذف تصاویر از Supabase
    if (adImages && adImages.length > 0) {
      // استخراج نام فایل‌ها از URL
      const fileNames = adImages.map(url => {
        try {
          // فرض بر این است که نام فایل بعد از uploads/ است
          const parts = url.split('/uploads/');
          return parts.length > 1 ? 'uploads/' + parts[1] : null;
        } catch {
          return null;
        }
      }).filter(Boolean);

      if (fileNames.length > 0) {
        const { error: storageError } = await supabase.storage.from('pic').remove(fileNames);
        if (storageError) {
          toast({ title: 'خطا در حذف تصاویر آگهی', description: storageError.message, variant: 'destructive' });
          return;
        }
      }
    }

    // حذف رکورد آگهی از دیتابیس
    const { error } = await supabase.from('ads').delete().eq('id', adId);
    if (!error) {
      // به‌روزرسانی لیست آگهی‌ها در state
      setAds(prev => prev.filter(ad => ad.id !== adId));
      toast({ title: 'آگهی حذف شد', variant: 'default' });
    } else {
      toast({ title: 'خطا در حذف آگهی', description: error.message, variant: 'destructive' });
    }
  };

  const startEditUser = (user: any) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.full_name || '',
      phone: user.phone || '',
      city: user.city || '',
    });
  };

  const saveEditUser = async () => {
    if (!editingUser) return;
    const { error } = await supabase
      .from('profiles')
      .update(editForm)
      .eq('id', editingUser.id);
    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, ...editForm } : u))
      );
      toast({ title: 'پروفایل کاربر ویرایش شد', variant: 'default' });
      setEditingUser(null);
    } else {
      toast({ title: 'خطا در ویرایش پروفایل', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (!error) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast({ title: 'کاربر حذف شد', variant: 'default' });
    } else {
      toast({ title: 'خطا در حذف کاربر', description: error.message, variant: 'destructive' });
    }
  };

  // حذف چندگانه آگهی‌ها
  const handleBulkDelete = async () => {
    if (selectedAds.length === 0) return;
    const confirmed = window.confirm('آیا از حذف آگهی‌های انتخاب‌شده مطمئن هستید؟ تصاویر نیز حذف خواهند شد.');
    if (!confirmed) return;

    // پیدا کردن آگهی‌های انتخاب‌شده
    const adsToDelete = ads.filter(ad => selectedAds.includes(ad.id));

    // حذف تصاویر هر آگهی
    for (const ad of adsToDelete) {
      if (Array.isArray(ad.images) && ad.images.length > 0) {
        const fileNames = ad.images.map(url => {
          const parts = url.split('/uploads/');
          return parts.length > 1 ? 'uploads/' + parts[1] : null;
        }).filter(Boolean);
        if (fileNames.length > 0) {
          await supabase.storage.from('pic').remove(fileNames);
        }
      }
    }

    // حذف آگهی‌ها از دیتابیس
    const { error } = await supabase.from('ads').delete().in('id', selectedAds);
    if (!error) {
      setAds(prev => prev.filter(ad => !selectedAds.includes(ad.id)));
      setSelectedAds([]);
      toast({ title: 'آگهی‌های انتخاب‌شده حذف شدند', variant: 'default' });
    } else {
      toast({ title: 'خطا در حذف آگهی‌ها', description: error.message, variant: 'destructive' });
    }
  };

  // حذف یک پیام
  const handleDeleteMessage = async (messageId: string) => {
    const confirmed = window.confirm('آیا از حذف این پیام مطمئن هستید؟');
    if (!confirmed) return;
    const { error } = await supabase.from('messages').delete().eq('id', messageId);
    if (!error) {
      // بعد از حذف موفق، پیام‌ها را مجدداً واکشی کن
      fetchAdminChatMessages();
    } else {
      alert('خطا در حذف پیام: ' + error.message);
      console.log('Supabase delete error:', error);
    }
  };
  // حذف کل چت
  const handleDeleteConversation = async () => {
    if (!adminSelectedChat) return;
    const confirmed = window.confirm('آیا از حذف کل این گفتگو مطمئن هستید؟');
    if (!confirmed) return;
    await supabase
      .from('messages')
      .delete()
      .eq('ad_id', adminSelectedChat.ad_id)
      .in('sender_id', [adminSelectedChat.user1, adminSelectedChat.user2])
      .in('receiver_id', [adminSelectedChat.user1, adminSelectedChat.user2]);
    setAdminChatMessages([]);
    setAdminSelectedChat(null);
    setAllConversations(convs => convs.filter(c => !(c.ad_id === adminSelectedChat.ad_id && c.user1 === adminSelectedChat.user1 && c.user2 === adminSelectedChat.user2)));
  };

  if (loading || checking) {
    return <div>در حال بررسی دسترسی...</div>;
  }

  if (!isAdmin) {
    return <div>شما به این صفحه دسترسی ندارید.</div>;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pb-24">
        <h1 className="text-3xl font-bold mb-8 text-primary">پنل مدیریت</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                کاربران
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalUsers.toLocaleString('fa-IR')}</div>
              <p className="text-sm text-muted-foreground">
                {'-'} کاربر فعال
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Archive className="h-5 w-5 text-fuchsia-500" />
                آگهی‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalAds.toLocaleString('fa-IR')}</div>
              <p className="text-sm text-muted-foreground">
                {stats.activeAds.toLocaleString('fa-IR')} آگهی فعال
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5 text-green-500" />
                دسته‌بندی‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.categories.toLocaleString('fa-IR')}</div>
              <p className="text-sm text-muted-foreground">
                {stats.pendingAds.toLocaleString('fa-IR')} آگهی در انتظار تایید
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-orange-500" />
                بازدیدها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.todayVisits.toLocaleString('fa-IR')}</div>
              <p className="text-sm text-muted-foreground">
                {stats.monthlyVisits.toLocaleString('fa-IR')} بازدید ماهانه
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-4 w-full justify-start overflow-x-auto">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" /> کاربران
            </TabsTrigger>
            <TabsTrigger value="ads" className="flex items-center gap-2">
              <Archive className="h-4 w-4" /> آگهی‌ها
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" /> تنظیمات
            </TabsTrigger>
            <TabsTrigger value="chats" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> همه چت‌ها
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>مدیریت کاربران</CardTitle>
                <CardDescription>
                  مشاهده و مدیریت کاربران سایت
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableCaption>لیست کاربران سایت</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>شناسه</TableHead>
                      <TableHead>نام کامل</TableHead>
                      <TableHead>شماره تماس</TableHead>
                      <TableHead>شهر</TableHead>
                      <TableHead>تاریخ ساخت</TableHead>
                      <TableHead>تاریخ ویرایش</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{user.full_name}</TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell>{user.city}</TableCell>
                        <TableCell>{user.created_at ? new Date(user.created_at).toLocaleString('fa-IR') : '-'}</TableCell>
                        <TableCell>{user.updated_at ? new Date(user.updated_at).toLocaleString('fa-IR') : '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => startEditUser(user)}>ویرایش</Button>
                            <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteUser(user.id)}>حذف</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {editingUser && (
                  <div className="p-4 border rounded-md bg-gray-50 my-4">
                    <h3 className="font-bold mb-2">ویرایش کاربر: {editingUser.full_name}</h3>
                    <div className="flex gap-4 mb-2">
                      <input
                        className="border p-2 rounded"
                        placeholder="نام کامل"
                        value={editForm.full_name}
                        onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                      />
                      <input
                        className="border p-2 rounded"
                        placeholder="شماره تماس"
                        value={editForm.phone}
                        onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                      />
                      <input
                        className="border p-2 rounded"
                        placeholder="شهر"
                        value={editForm.city}
                        onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))}
                      />
                    </div>
                    <Button className="mr-2" onClick={saveEditUser}>ذخیره</Button>
                    <Button variant="outline" onClick={() => setEditingUser(null)}>انصراف</Button>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">کاربر جدید</Button>
                <div className="flex items-center text-sm">
                  نمایش 1-{users.length} از {stats.totalUsers} کاربر
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="ads" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>مدیریت آگهی‌ها</CardTitle>
                <CardDescription>
                  مشاهده و مدیریت آگهی‌های سایت
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableCaption>لیست آگهی‌های سایت</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <input
                          type="checkbox"
                          checked={ads.length > 0 && selectedAds.length === ads.length}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedAds(ads.map(ad => ad.id));
                            } else {
                              setSelectedAds([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>شناسه</TableHead>
                      <TableHead>عنوان</TableHead>
                      <TableHead>دسته‌بندی</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>تاریخ</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ads.map((ad) => (
                      <TableRow key={ad.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedAds.includes(ad.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedAds(prev => [...prev, ad.id]);
                              } else {
                                setSelectedAds(prev => prev.filter(id => id !== ad.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>{ad.id}</TableCell>
                        <TableCell>
                          <div className="flex items-start gap-3">
                            {/* Thumbnail */}
                            {Array.isArray(ad.images) && ad.images.length > 0 ? (
                              <img
                                src={ad.images[0]}
                                alt={ad.title}
                                className="w-16 h-16 object-cover rounded-md border"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded-md text-gray-400 text-xs">بدون تصویر</div>
                            )}
                            <div>
                              <div className="font-medium text-base mb-1">{ad.title}</div>
                              <div className="text-xs text-gray-500 mb-1">{ad.description || 'بدون توضیحات'}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{ad.category}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                              ad.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : ad.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {ad.status}
                          </span>
                        </TableCell>
                        <TableCell>{ad.date || (ad.created_at ? new Date(ad.created_at).toLocaleDateString('fa-IR') : '-')}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => navigate(`/ad/${ad.id}`)}>مشاهده</Button>
                            <Button variant="outline" size="sm">ویرایش</Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteAd(ad.id, ad.images)}
                            >
                              حذف
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 hover:text-green-800"
                              onClick={() => handleApproveAd(ad.id)}
                            >
                              تایید
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-800"
                              onClick={() => handleRejectAd(ad.id)}
                            >
                              رد
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <CardFooter className="flex justify-between items-center">
                  <Button variant="outline">آگهی جدید</Button>
                  <Button
                    variant="destructive"
                    disabled={selectedAds.length === 0}
                    onClick={handleBulkDelete}
                    className="ml-2"
                  >
                    حذف انتخاب‌شده‌ها
                  </Button>
                  <div className="flex items-center text-sm">
                    نمایش 1-{ads.length} از {stats.totalAds} آگهی
                  </div>
                </CardFooter>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>تنظیمات سایت</CardTitle>
                <CardDescription>
                  مدیریت تنظیمات عمومی سایت
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">تنظیمات عمومی</h3>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">عنوان سایت</label>
                          <input 
                            type="text" 
                            defaultValue="چی کو" 
                            className="w-full p-2 border rounded-md" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">توضیحات سایت</label>
                          <input 
                            type="text" 
                            defaultValue="سایت خرید و فروش آنلاین" 
                            className="w-full p-2 border rounded-md" 
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">آدرس سایت</label>
                        <input 
                          type="text" 
                          defaultValue="https://newdivar.ir" 
                          className="w-full p-2 border rounded-md" 
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">لوگوی سایت</label>
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded-md">لوگو</div>
                          <Button variant="outline">آپلود لوگو</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">تنظیمات آگهی‌ها</h3>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">حداکثر تعداد تصاویر</label>
                          <input 
                            type="number" 
                            defaultValue="10" 
                            className="w-full p-2 border rounded-md" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">مدت زمان آگهی (روز)</label>
                          <input 
                            type="number" 
                            defaultValue="30" 
                            className="w-full p-2 border rounded-md" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">تایید خودکار آگهی</label>
                          <select className="w-full p-2 border rounded-md" defaultValue="no">
                            <option value="yes">بله</option>
                            <option value="no">خیر</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button>ذخیره تنظیمات</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="chats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold">{allConversations.length}</div>
                      <div className="text-sm text-gray-500">کل گفتگوها</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold">{users.length}</div>
                      <div className="text-sm text-gray-500">کاربران فعال</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="text-2xl font-bold">{ads.length}</div>
                      <div className="text-sm text-gray-500">آگهی‌های فعال</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>مدیریت چت‌ها</CardTitle>
                <CardDescription>مشاهده و مدیریت همه گفتگوهای کاربران</CardDescription>
              </CardHeader>
              <CardContent>
                {adminSelectedChat ? (
                  <>
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4">
                          <Button variant="outline" onClick={() => setAdminSelectedChat(null)}>
                            ← بازگشت به لیست گفتگوها
                          </Button>
                          <div className="text-sm">
                            <span className="font-bold text-blue-600">آگهی:</span> {adminSelectedChat.adTitle || `آگهی ${adminSelectedChat.ad_id}`}
                          </div>
                        </div>
                        <Button variant="destructive" onClick={handleDeleteConversation} className="text-xs">
                          حذف کل گفتگو
                        </Button>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-bold">کاربران:</span> {adminSelectedChat.user1Name || adminSelectedChat.user1} و {adminSelectedChat.user2Name || adminSelectedChat.user2}
                      </div>
                    </div>
                    {adminChatLoading ? (
                      <div className="p-4 text-center text-gray-500">در حال بارگذاری پیام‌ها...</div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {adminChatMessages.length === 0 ? (
                          <div className="p-4 text-center text-gray-400">پیامی در این گفتگو وجود ندارد.</div>
                        ) : (
                          adminChatMessages.map(msg => (
                            <div key={msg.id} className="p-3 border rounded-lg bg-gray-50">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm text-blue-600">
                                    {adminUserMap[msg.sender_id] || msg.sender_id}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {new Date(msg.created_at).toLocaleString('fa-IR')}
                                  </span>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="destructive" 
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="text-xs"
                                >
                                  حذف
                                </Button>
                              </div>
                              <div className="text-sm text-gray-700">{msg.content}</div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="جستجو در گفتگوها..."
                        className="w-full p-2 border rounded-lg"
                        value={chatFilter}
                        onChange={(e) => setChatFilter(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      {allConversations.length === 0 ? (
                        <div className="p-4 text-gray-400 text-center">گفتگویی وجود ندارد.</div>
                      ) : (
                        <div className="grid gap-2">
                          {allConversations
                            .filter(conv => 
                              chatFilter === '' || 
                              (conv.adTitle && conv.adTitle.toLowerCase().includes(chatFilter.toLowerCase())) ||
                              (conv.user1Name && conv.user1Name.toLowerCase().includes(chatFilter.toLowerCase())) ||
                              (conv.user2Name && conv.user2Name.toLowerCase().includes(chatFilter.toLowerCase()))
                            )
                            .map(conv => (
                            <div 
                              key={conv.ad_id + '-' + conv.user1 + '-' + conv.user2} 
                              className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" 
                              onClick={() => setAdminSelectedChat(conv)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-gray-700 mb-1">
                                    آگهی: {conv.adTitle || `آگهی ${conv.ad_id}`}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    کاربران: {conv.user1Name || conv.user1} و {conv.user2Name || conv.user2}
                                  </div>
                                </div>
                                <div className="text-xs text-gray-400">
                                  <MessageSquare className="w-4 h-4" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
