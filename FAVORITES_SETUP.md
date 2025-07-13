# راهنمای تنظیم قابلیت نشان کردن آگهی‌ها

## ایجاد جدول favorites در Supabase

برای استفاده از قابلیت نشان کردن آگهی‌ها، باید جدول `favorites` را در Supabase ایجاد کنید:

### 1. ایجاد جدول favorites

در SQL Editor در Supabase، این کد را اجرا کنید:

```sql
-- ایجاد جدول favorites
CREATE TABLE public.favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, ad_id)
);

-- ایجاد ایندکس برای بهبود عملکرد
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_ad_id ON public.favorites(ad_id);

-- فعال‌سازی RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- ایجاد پالیسی‌های امنیتی
CREATE POLICY "Users can view their own favorites" ON public.favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" ON public.favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON public.favorites
    FOR DELETE USING (auth.uid() = user_id);
```

### 2. بررسی ساختار جدول

جدول `favorites` شامل این فیلدها است:

- `id`: شناسه یکتا (UUID)
- `user_id`: شناسه کاربر (مرجع به جدول auth.users)
- `ad_id`: شناسه آگهی (مرجع به جدول ads)
- `created_at`: تاریخ ایجاد رکورد

### 3. قابلیت‌های اضافه شده

✅ **دکمه نشان کردن در صفحه جزییات آگهی**
- دکمه قلب در کنار دکمه‌های تماس و پیام
- تغییر رنگ و حالت بر اساس وضعیت نشان کردن

✅ **صفحه آگهی‌های نشان شده**
- نمایش لیست آگهی‌های نشان شده
- قابلیت حذف از نشان شده‌ها
- نمایش تصویر، قیمت و اطلاعات آگهی

✅ **دکمه در نوار ناوبری**
- نمایش تعداد آگهی‌های نشان شده
- دسترسی سریع به صفحه نشان شده‌ها

✅ **دکمه نشان کردن در لیست آگهی‌ها**
- در صفحه دسته‌بندی‌ها
- در صفحه آگهی‌های ویژه

✅ **هوک useFavorites**
- مدیریت وضعیت نشان کردن
- همگام‌سازی با دیتابیس
- نمایش پیام‌های موفقیت/خطا

### 4. نکات مهم

- کاربران باید وارد سیستم باشند تا بتوانند آگهی‌ها را نشان کنند
- هر کاربر فقط می‌تواند آگهی‌های خودش را نشان کند (RLS)
- حذف آگهی از دیتابیس، آن را از نشان شده‌ها نیز حذف می‌کند (CASCADE)
- تعداد آگهی‌های نشان شده در نوار ناوبری نمایش داده می‌شود

### 5. تست قابلیت

1. وارد سیستم شوید
2. به صفحه جزییات یک آگهی بروید
3. روی دکمه "نشان" کلیک کنید
4. به صفحه "آگهی‌های نشان شده" بروید
5. تعداد در نوار ناوبری را بررسی کنید 