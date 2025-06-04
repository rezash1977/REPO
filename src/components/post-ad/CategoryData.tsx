
import React from 'react';
import { Image, MessageSquare } from 'lucide-react';
import { CategoryOption } from '../../types/ad';

export const getCategoryData = (): CategoryOption[] => {
  return [
    { 
      id: 'realestate',
      slug: 'realestate', 
      name: 'املاک', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ea384c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      ), 
      color: '#D3E4FD' 
    },
    { 
      id: 'cars',
      slug: 'cars', 
      name: 'خودرو', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path>
          <circle cx="7" cy="17" r="2"></circle>
          <circle cx="17" cy="17" r="2"></circle>
        </svg>
      ), 
      color: '#F2FCE2' 
    },
    { 
      id: 'services',
      slug: 'services', 
      name: 'خدمات', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
        </svg>
      ), 
      color: '#FDE1D3' 
    },
    { 
      id: 'electronics',
      slug: 'electronics', 
      name: 'لوازم الکترونیکی', 
      icon: <MessageSquare size={24} color="#8B5CF6" />, 
      color: '#E5DEFF' 
    },
    { 
      id: 'furniture',
      slug: 'furniture', 
      name: 'وسایل خانه', 
      icon: <Image size={24} color="#D946EF" />, 
      color: '#FFDEE2' 
    },
    { 
      id: 'jobs',
      slug: 'jobs', 
      name: 'استخدام', 
      icon: <MessageSquare size={24} color="#EAB308" />, 
      color: '#FEF7CD' 
    },
  ];
};
