import React, { useState, useRef } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Image, Trash, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AdImage, AdFormData } from '@/types/ad';
import { useCreateAd } from '@/hooks/useCreateAd';
import { useCategories } from '@/hooks/useCategories';
import { supabase } from '@/integrations/supabase/client';

interface DetailsStepProps {
  formData: Partial<AdFormData>;
  updateFormData: (data: Partial<AdFormData>) => void;
  goToPrevStep: () => void;
  onAdCreated: () => void;
}

const DetailsStep: React.FC<DetailsStepProps> = ({ 
  formData, 
  updateFormData, 
  goToPrevStep, 
  onAdCreated 
}) => {
  const [images, setImages] = useState<AdImage[]>(formData.images || []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createAdMutation = useCreateAd();
  const { data: categories } = useCategories();
  const recognitionDescRef = useRef<any>(null);

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Check if maximum number of images is reached
    if (images.length + files.length > 6) {
      toast({
        title: "تعداد تصاویر بیش از حد مجاز",
        description: "حداکثر ۶ تصویر می‌توانید انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    const newImages: AdImage[] = [];
    
    Array.from(files).forEach(file => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "نوع فایل نامعتبر",
          description: "لطفاً فقط تصویر انتخاب کنید",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "حجم فایل زیاد است",
          description: "حداکثر حجم هر تصویر ۵ مگابایت است",
          variant: "destructive",
        });
        return;
      }

      const id = `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const preview = URL.createObjectURL(file);
      
      newImages.push({ id, file, preview });
    });

    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);
    updateFormData({ images: updatedImages });
    
    // Reset the input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (id: string) => {
    // Revoke the object URL to avoid memory leaks
    const imageToRemove = images.find(img => img.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    
    const updatedImages = images.filter(image => image.id !== id);
    setImages(updatedImages);
    updateFormData({ images: updatedImages });
  };

  // تابع آپلود تصویر به Supabase و دریافت publicUrl با استفاده از supabase-js
  async function uploadImageToSupabase(file: File): Promise<string> {
    if (!(file instanceof File)) {
      throw new Error('فایل معتبر نیست');
    }
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('pic')
      .upload('uploads/' + fileName, file);
    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }
    const { data: publicUrlData } = supabase
      .storage
      .from('pic')
      .getPublicUrl('uploads/' + fileName);
    return publicUrlData.publicUrl;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (images.length === 0) {
      toast({
        title: "تصویر انتخاب نشده",
        description: "لطفاً حداقل یک تصویر انتخاب کنید",
      });
      return;
    }

    // تبدیل ارقام فارسی به انگلیسی
    const toEnglishDigits = (str: string) =>
      str.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));

    if (!formData.price?.trim() || isNaN(Number(toEnglishDigits(formData.price)))) {
      toast({
        title: "قیمت وارد نشده یا نامعتبر است",
        description: "لطفاً قیمت را به صورت عددی وارد کنید",
      });
      return;
    }

    if (!formData.description?.trim()) {
      toast({
        title: "توضیحات وارد نشده",
        description: "لطفاً توضیحات آگهی را وارد کنید",
      });
      return;
    }

    if (!formData.location?.trim()) {
      toast({
        title: "موقعیت مکانی وارد نشده",
        description: "لطفاً موقعیت مکانی را وارد کنید",
      });
      return;
    }

    // Find category ID
    const selectedCategory = categories?.find(cat => cat.slug === formData.category);
    if (!selectedCategory) {
      toast({
        title: "دسته‌بندی نامعتبر",
        description: "لطفاً دسته‌بندی معتبری انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    // آپلود همه تصاویر و دریافت publicUrlها
    const imageUrls: string[] = [];
    for (const img of images) {
      if (img.file) {
        const url = await uploadImageToSupabase(img.file);
        imageUrls.push(url);
      }
    }

    // Log price before sending
    const englishPrice = toEnglishDigits(formData.price);
    console.log('price to be sent:', englishPrice, typeof englishPrice);

    try {
      await createAdMutation.mutateAsync({
        title: formData.title!,
        category_id: selectedCategory.id,
        description: formData.description,
        price: Number(englishPrice),
        location: formData.location,
        phone: formData.phone,
        images: imageUrls // فقط publicUrlها ذخیره شود
      });

      onAdCreated();
    } catch (error) {
      console.error('Failed to create ad:', error);
    }
  };

  const handleStartVoiceDesc = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "پشتیبانی نشد",
        description: "مرورگر شما از تبدیل گفتار به متن پشتیبانی نمی‌کند.",
        variant: "destructive",
      });
      return;
    }

    if (!recognitionDescRef.current) {
      recognitionDescRef.current = new SpeechRecognition();
      recognitionDescRef.current.lang = "fa-IR";
      recognitionDescRef.current.interimResults = false;
      recognitionDescRef.current.maxAlternatives = 1;
    }

    recognitionDescRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      updateFormData({ description: (formData.description || '') + transcript });
      toast({
        title: "متن دریافت شد",
        description: transcript,
      });
    };

    recognitionDescRef.current.onerror = (event: any) => {
      toast({
        title: "خطا در تشخیص صدا",
        description: event.error,
        variant: "destructive",
      });
    };

    recognitionDescRef.current.start();
    toast({
      title: "در حال گوش دادن...",
      description: "لطفاً توضیحات آگهی را بیان کنید.",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-4 animate-fade-in">
      <div className="flex items-center mb-4">
        <button type="button" onClick={goToPrevStep} className="ml-2">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <h2 className="font-bold">آپلود تصاویر</h2>
      </div>
      
      <div className="mb-6">
        <div className="grid grid-cols-3 gap-3 mb-3">
          <button
            type="button"
            onClick={handleImageClick}
            className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <Upload className="text-gray-400" size={24} />
            <span className="text-xs text-gray-500">افزودن</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
            />
          </button>
          
          {images.map((image) => (
            <div key={image.id} className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden group">
              <img 
                src={image.preview} 
                alt="تصویر آگهی" 
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(image.id)}
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash size={14} />
              </button>
            </div>
          ))}
          
          {/* Placeholder empty boxes for visual balance */}
          {Array.from({ length: Math.max(0, 6 - images.length - 1) }).map((_, index) => (
            <div key={`placeholder-${index}`} className="aspect-square bg-gray-100 rounded-lg"></div>
          ))}
        </div>
        
        <div className="text-xs text-gray-500 flex items-center">
          <div className="rounded-full bg-blue-100 p-1 ml-2">
            <Image className="text-primary" size={14} />
          </div>
          <span>تصاویر با کیفیت بالاتر شانس فروش را افزایش می‌دهند</span>
        </div>
      </div>
      
      <h2 className="font-bold mb-2">مشخصات آگهی</h2>
      <div className="space-y-4 mb-6">
        <div className="relative">
          <label className="block text-sm mb-1">عنوان آگهی</label>
          <Input
            type="text"
            value={formData.title || ''}
            onChange={(e) => updateFormData({ title: e.target.value })}
            placeholder="عنوان آگهی"
            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm mb-1">قیمت (تومان)</label>
          <Input
            type="text"
            value={formData.price || ''}
            onChange={(e) => updateFormData({ price: e.target.value })}
            placeholder="مثال: ۸٬۵۰۰٬۰۰۰٬۰۰۰"
            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm mb-1">توضیحات</label>
          <div className="relative">
            <Textarea
              value={formData.description || ''}
              onChange={(e) => updateFormData({ description: e.target.value })}
              placeholder="جزئیات آگهی را وارد کنید..."
              rows={4}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={handleStartVoiceDesc}
              className="absolute left-2 top-2 bg-gray-100 p-2 rounded-full hover:bg-primary hover:text-white transition"
              title="ورود توضیحات با صدا"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 15a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 14 0Z"/></svg>
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm mb-1">موقعیت مکانی</label>
          <Input
            type="text"
            value={formData.location || ''}
            onChange={(e) => updateFormData({ location: e.target.value })}
            placeholder="مثال: تهران، ونک"
            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">شماره تماس (اختیاری)</label>
          <Input
            type="text"
            value={formData.phone || ''}
            onChange={(e) => updateFormData({ phone: e.target.value })}
            placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
      
      <Button
        type="submit"
        disabled={createAdMutation.isPending}
        className="w-full p-3 rounded-lg font-medium bg-primary text-white mb-3"
      >
        {createAdMutation.isPending ? 'در حال ثبت...' : 'ثبت آگهی'}
      </Button>
      
      <div className="text-xs text-gray-500 flex items-center justify-center">
        <div className="rounded-full bg-blue-100 p-1 ml-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 16a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm1-5a1 1 0 0 1-2 0V8a1 1 0 0 1 2 0z"></path>
          </svg>
        </div>
        <span>با ثبت آگهی، با قوانین چی کو موافقت می‌کنید</span>
      </div>
    </form>
  );
};

export default DetailsStep;
