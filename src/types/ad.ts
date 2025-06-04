
export interface CategoryOption {
  id: string;
  slug: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

export interface AdImage {
  id: string;
  file: File;
  preview: string;
}

export interface AdFormData {
  category: string;
  title: string;
  description: string;
  price: string;
  location: string;
  phone: string;
  images: AdImage[];
}
