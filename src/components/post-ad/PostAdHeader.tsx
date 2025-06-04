
import React from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

interface PostAdHeaderProps {
  step: number;
}

const PostAdHeader: React.FC<PostAdHeaderProps> = ({ step }) => {
  return (
    <div className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="text-gray-500 ml-2">
              <X size={24} />
            </Link>
            <h1 className="text-xl font-bold">ثبت آگهی جدید</h1>
          </div>
          <div className="flex items-center">
            <span className="text-xs text-gray-500">مرحله</span>
            <span className="mx-1 font-bold">{step}</span>
            <span className="text-xs text-gray-500">از ۳</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostAdHeader;
