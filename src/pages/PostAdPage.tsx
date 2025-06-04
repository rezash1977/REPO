import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '../components/layout/Navbar';
import TitleStep from '../components/post-ad/TitleStep';
import CategoryStep from '../components/post-ad/CategoryStep';
import DetailsStep from '../components/post-ad/DetailsStep';
import PostAdHeader from '../components/post-ad/PostAdHeader';
import { AdFormData } from '@/types/ad';

// تابع آپلود تصویر به فانکشن Edge Supabase
async function uploadImageToSupabase(file) {
  const formData = new FormData();
  formData.append('file', file);
  // آدرس فانکشن Edge خود را جایگزین کنید
  const response = await fetch('https://mosujjmlfwemaaanhrcm.supabase.co/storage/v1/s3', {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    throw new Error('خطا در آپلود تصویر');
  }
  const result = await response.json();
  return result.publicUrl;
}

const PostAdPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<AdFormData>>({
    title: '',
    category: '',
    description: '',
    price: '',
    location: '',
    phone: '',
    images: []
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }
  
  const goToNextStep = () => {
    if (step === 1 && formData.title) {
      setStep(2);
    } else if (step === 2 && formData.category) {
      setStep(3);
    }
  };

  const goToPrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const updateFormData = (data: Partial<AdFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const onAdCreated = () => {
    // Navigate back to home page after successful ad creation
    navigate('/');
  };

  const handleFilesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setImageFiles(files);
    setUploading(true);
    setImageUrls([]);
    setPreviewImages([]);
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(previews);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const url = await uploadImageToSupabase(file);
        urls.push(url);
      }
      setImageUrls(urls);
      setUploading(false);
    } catch (err: any) {
      setUploading(false);
      alert(err.message);
    }
  };

  const handleSubmitAd = async () => {
    setSubmitError(null);
    if (!formData.title || !formData.category || !formData.description) {
      setSubmitError('لطفاً تمام فیلدهای ضروری را پر کنید.');
      return;
    }
    if (uploading) {
      setSubmitError('لطفاً تا پایان آپلود تصاویر صبر کنید.');
      return;
    }
    try {
      const adData = {
        ...formData,
        price: formData.price ? Number(formData.price) : undefined,
        user_id: user?.id,
        imageUrls,
      };
      const res = await fetch('/api/ads/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adData),
      });
      if (!res.ok) throw new Error('خطا در ثبت آگهی');
      onAdCreated();
    } catch (err: any) {
      setSubmitError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PostAdHeader step={step} />
      
      <main className="container mx-auto px-4 py-6 pb-20">
        {step === 1 && (
          <TitleStep 
            title={formData.title || ''} 
            setTitle={(title) => updateFormData({ title })} 
            goToNextStep={goToNextStep} 
          />
        )}
        
        {step === 2 && (
          <CategoryStep 
            category={formData.category || null} 
            setCategory={(category) => updateFormData({ category })} 
            goToNextStep={goToNextStep}
            goToPrevStep={goToPrevStep}
          />
        )}
        
        {step === 3 && (
          <>
            <DetailsStep 
              formData={formData}
              updateFormData={updateFormData}
              goToPrevStep={goToPrevStep}
              onAdCreated={onAdCreated}
            />
            <div className="my-4">
              <label className="block mb-2 font-bold">انتخاب تصاویر آگهی (چندتایی):</label>
              <input type="file" multiple accept="image/*" onChange={handleFilesChange} />
              {uploading && <div className="text-blue-600 mt-2">در حال آپلود تصاویر...</div>}
              {previewImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {previewImages.map((url, idx) => (
                    <img key={idx} src={url} alt="ad" className="w-20 h-20 object-cover rounded border" />
                  ))}
                </div>
              )}
            </div>
            <button
              className="bg-primary text-white px-6 py-2 rounded mt-4"
              onClick={handleSubmitAd}
              disabled={uploading}
            >
              ثبت آگهی
            </button>
            {submitError && <div className="text-red-500 mt-2">{submitError}</div>}
          </>
        )}
      </main>
      
      <Navbar />
    </div>
  );
};

export default PostAdPage;
