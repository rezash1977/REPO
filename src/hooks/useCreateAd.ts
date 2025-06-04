import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AdFormData } from '@/types/ad';

interface CreateAdData {
  title: string;
  category_id: string;
  description: string;
  price: number | null;
  location: string;
  phone?: string;
  images?: string[]; // اختیاری، اگر نوع فیلد jsonb است
}

export const useCreateAd = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (adData: CreateAdData) => {
      console.log('Creating ad with data:', adData);
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User must be authenticated to create an ad');
      }

      // آماده‌سازی داده برای ارسال فقط با فیلدهای معتبر
      const insertData: any = {
        title: adData.title,
        category_id: adData.category_id,
        description: adData.description,
        price: adData.price !== null && adData.price !== undefined ? Number(adData.price) : null,
        location: adData.location,
        phone: adData.phone,
        user_id: user.id,
        status: 'pending',
      };
      // اگر فیلد images در جدول jsonb است:
      if (adData.images) {
        insertData.images = adData.images;
      }

      const { data, error } = await supabase
        .from('ads')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating ad:', error);
        throw error;
      }

      console.log('Ad created successfully:', data);
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch ads
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      
      toast({
        title: "آگهی ثبت شد",
        description: "آگهی شما با موفقیت ثبت شد و در انتظار تایید است",
      });
    },
    onError: (error) => {
      console.error('Failed to create ad:', error);
      toast({
        title: "خطا در ثبت آگهی",
        description: "متأسفانه مشکلی پیش آمد. لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    },
  });
};
