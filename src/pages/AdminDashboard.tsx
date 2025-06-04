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
import { User, Settings, Users, Database, Archive } from "lucide-react";
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
                          <select className="w-full p-2 border rounded-md">
                            <option value="yes">بله</option>
                            <option value="no" selected>خیر</option>
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
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
