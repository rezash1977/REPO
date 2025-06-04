
import React from 'react';

interface TitleStepProps {
  title: string;
  setTitle: (title: string) => void;
  goToNextStep: () => void;
}

const TitleStep: React.FC<TitleStepProps> = ({ title, setTitle, goToNextStep }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 animate-fade-in">
      <h2 className="font-bold mb-4">عنوان آگهی</h2>
      
      <div className="mb-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="مثال: آپارتمان ۸۰ متری در ونک"
          className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        
        <div className="mt-2 flex items-center">
          <div className="rounded-full bg-blue-100 p-1 ml-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 16a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm1-5a1 1 0 0 1-2 0V8a1 1 0 0 1 2 0z"></path>
            </svg>
          </div>
          <span className="text-xs text-gray-500">عنوان باید واضح و دقیق باشد</span>
        </div>
        
        {title.length > 0 && (
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start">
            <div className="rounded-full bg-primary p-1 ml-2 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M12 16v-4M12 8h.01"></path>
                <path d="M22 12c0 5.5-4.5 10-10 10S2 17.5 2 12 6.5 2 12 2s10 4.5 10 10z"></path>
              </svg>
            </div>
            <div>
              <p className="text-sm text-blue-700 font-medium">پیشنهاد هوشمند چی کو</p>
              <p className="text-xs text-gray-600">
                بر اساس عنوان آگهی شما، این آگهی احتمالاً در دسته‌بندی «املاک» قرار می‌گیرد.
              </p>
            </div>
          </div>
        )}
      </div>
      
      <button
        onClick={goToNextStep}
        disabled={!title}
        className={`w-full p-3 rounded-lg font-medium ${
          title ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
        }`}
      >
        مرحله بعد
      </button>
    </div>
  );
};

export default TitleStep;
