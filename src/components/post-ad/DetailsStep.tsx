import React, { useState, useRef } from 'react';
import { ChevronLeft, Mic } from 'lucide-react';
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
  const [isGenerating, setIsGenerating] = useState(false);

  // Debug function to log webhook response
  const debugWebhookResponse = (response: any, contentType: string | null) => {
    console.log('Webhook Response Debug:', {
      status: response.status,
      statusText: response.statusText,
      contentType: contentType,
      headers: Object.fromEntries(response.headers.entries())
    });
  };

  // Upload image to Supabase
  async function uploadImageToSupabase(file: File): Promise<string> {
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

  // Generate description via n8n webhook
  const handleGenerateDescription = async () => {
    if (!formData.title) {
      toast({ title: 'عنوان آگهی الزامی است', variant: 'destructive' });
      return;
    }
    setIsGenerating(true);
    try {
      console.log('Sending request to webhook with title:', formData.title);
      
      const response = await fetch('https://windywindy.app.n8n.cloud/webhook/d5b07a3e-4b39-4883-bf7c-7bddfb4845dd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formData.title })
      });
      
      const contentType = response.headers.get('content-type');
      debugWebhookResponse(response, contentType);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      // Try to parse as JSON first
      let descriptionText = '';
      
      try {
        if (contentType && contentType.includes('application/json')) {
          const jsonData = await response.json();
          console.log('Parsed JSON response:', jsonData);
          
          // Handle different possible JSON response structures
          if (typeof jsonData === 'string') {
            descriptionText = jsonData;
          } else if (jsonData.description) {
            descriptionText = jsonData.description;
          } else if (jsonData.text) {
            descriptionText = jsonData.text;
          } else if (jsonData.result) {
            descriptionText = jsonData.result;
          } else if (jsonData.data) {
            descriptionText = jsonData.data;
          } else if (jsonData.message) {
            descriptionText = jsonData.message;
          } else if (Array.isArray(jsonData) && jsonData.length > 0) {
            // If it's an array, take the first element
            descriptionText = typeof jsonData[0] === 'string' ? jsonData[0] : JSON.stringify(jsonData[0]);
          } else {
            // If it's an object but doesn't have expected fields, stringify it
            descriptionText = JSON.stringify(jsonData);
          }
        } else {
          // If not JSON, treat as plain text
          const textResponse = await response.text();
          console.log('Text response:', textResponse);
          descriptionText = textResponse;
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        // Fallback to text if JSON parsing fails
        const textResponse = await response.text();
        console.log('Fallback text response:', textResponse);
        descriptionText = textResponse;
      }
      
      // Clean up the description text
      descriptionText = descriptionText.trim();
      
      if (!descriptionText) {
        throw new Error('پاسخ خالی از سرور دریافت شد');
      }
      
      console.log('Final description text:', descriptionText);
      
      updateFormData({ description: descriptionText });
      toast({ 
        title: 'توضیحات تولید شد', 
        description: 'توضیحات AI با موفقیت در کادر قرار گرفت.' 
      });
      
    } catch (error: any) {
      console.error('AI generation error:', error);
      let errorMessage = 'خطا در تولید توضیحات AI';
      
      if (error.message.includes('HTTP error')) {
        errorMessage = `خطا در ارتباط با سرور: ${error.message}`;
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'خطا در اتصال به اینترنت';
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'خطا در اتصال به سرور';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({ 
        title: 'خطا', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageClick = () => fileInputRef.current?.click();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (images.length + files.length > 6) {
      toast({ title: 'بیش از ۶ تصویر مجاز نیست', variant: 'destructive' });
      return;
    }
    const newImages: AdImage[] = [];
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'نوع فایل نامعتبر', variant: 'destructive' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'حداکثر ۵ مگابایت', variant: 'destructive' });
        return;
      }
      const id = `img-${Date.now()}-${Math.random().toString(36).substring(2,9)}`;
      const preview = URL.createObjectURL(file);
      newImages.push({ id, file, preview });
    });
    const updated = [...images, ...newImages];
    setImages(updated);
    updateFormData({ images: updated });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (id: string) => {
    const toRemove = images.find(i => i.id === id);
    if (toRemove) URL.revokeObjectURL(toRemove.preview);
    const updated = images.filter(i => i.id !== id);
    setImages(updated);
    updateFormData({ images: updated });
  };

  const handleStartVoiceDesc = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: 'پشتیبانی نمی‌شود', variant: 'destructive' });
      return;
    }
    if (!recognitionDescRef.current) {
      recognitionDescRef.current = new SpeechRecognition();
      recognitionDescRef.current.lang = 'fa-IR';
      recognitionDescRef.current.interimResults = false;
    }
    recognitionDescRef.current.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      updateFormData({ description: (formData.description || '') + transcript });
      toast({ title: 'متن دریافت شد', description: transcript });
    };
    recognitionDescRef.current.onerror = (e: any) => {
      toast({ title: 'خطا در تشخیص صدا', description: e.error, variant: 'destructive' });
    };
    recognitionDescRef.current.start();
    toast({ title: 'گوش دادن...' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      toast({ title: 'تصویر انتخاب نشده', variant: 'destructive' });
      return;
    }
    const toEnglish = (str: string) => str.replace(/[۰-۹]/g, d => String('۰۱۲۳৪۵۶۷۸۹'.indexOf(d)));
    if (!formData.price?.trim() || isNaN(Number(toEnglish(formData.price)))) {
      toast({ title: 'قیمت نامعتبر', variant: 'destructive' });
      return;
    }
    if (!formData.description?.trim()) {
      toast({ title: 'توضیحات وارد نشده', variant: 'destructive' });
      return;
    }
    if (!formData.location?.trim()) {
      toast({ title: 'موقعیت وارد نشده', variant: 'destructive' });
      return;
    }
    const category = categories?.find(c => c.slug === formData.category);
    if (!category) {
      toast({ title: 'دسته‌بندی نامعتبر', variant: 'destructive' });
      return;
    }
    const imageUrls: string[] = [];
    for (const img of images) {
      if (img.file) imageUrls.push(await uploadImageToSupabase(img.file));
    }
    try {
      await createAdMutation.mutateAsync({
        title: formData.title!,
        category_id: category.id,
        description: formData.description,
        price: Number(toEnglish(formData.price)),
        location: formData.location,
        phone: formData.phone,
        images: imageUrls
      });
      onAdCreated();
    } catch (err) {
      console.error(err);
    }
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
          <button type="button" onClick={handleImageClick} className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50">
            <Upload size={24} className="text-gray-400" />
            <span className="text-xs text-gray-500">افزودن</span>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
          </button>
          {images.map(img => (
            <div key={img.id} className="aspect-square relative rounded-lg overflow-hidden group bg-gray-100">
              <img src={img.preview} alt="ad" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeImage(img.id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-500 text-white p-1 rounded-full">
                <Trash size={14} />
              </button>
            </div>
          ))}
          {Array.from({ length: Math.max(0, 6 - images.length - 1) }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-gray-100"></div>
          ))}
        </div>
        <div className="text-xs text-gray-500 flex items-center">
          <div className="rounded-full bg-blue-100 p-1 ml-2">
            <Image size={14} className="text-primary" />
          </div>
          <span>تصاویر باکیفیت شانس فروش را افزایش می‌دهند</span>
        </div>
      </div>
      <h2 className="font-bold mb-2">مشخصات آگهی</h2>
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm mb-1">عنوان آگهی</label>
          <Input value={formData.title || ''} onChange={e => updateFormData({ title: e.target.value })} placeholder="عنوان آگهی" className="w-full" />
        </div>
        <div>
          <label className="block text-sm mb-1">قیمت (تومان)</label>
          <Input value={formData.price || ''} onChange={e => updateFormData({ price: e.target.value })} placeholder="مثال: ۸,۵۰۰,۰۰۰" className="w-full" />
        </div>
        <div>
          <label className="block text-sm mb-1">توضیحات آگهی</label>
          <div className="relative">
            <Textarea value={formData.description || ''} onChange={e => updateFormData({ description: e.target.value })} rows={4} placeholder="جزئیات آگهی را وارد کنید..." className="w-full" />
            <Button type="button" onClick={handleStartVoiceDesc} className="absolute left-2 top-2" title="ورود صوتی">
              <Mic size={16} />
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleGenerateDescription} disabled={!formData.title || isGenerating} className="absolute left-2 bottom-2">
              {isGenerating ? 'در حال تولید...' : 'تولید توضیحات با AI'}
            </Button>
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">موقعیت مکانی</label>
          <Input value={formData.location || ''} onChange={e => updateFormData({ location: e.target.value })} placeholder="مثال: تهران، سعادت‌آباد" className="w-full" />
        </div>
      </div>
      <Button type="submit" className="w-full p-3 bg-primary text-white rounded-lg font-medium">
        {createAdMutation.isPending ? 'در حال ثبت...' : 'ثبت آگهی'}
      </Button>
    </form>
  );
};

export default DetailsStep;
