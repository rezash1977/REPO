
import React from 'react';
import Header from '../components/layout/Header';
import Navbar from '../components/layout/Navbar';
import CategoryList from '../components/home/CategoryList';
import TaglineSection from '../components/home/TaglineSection';
import FeaturedAds from '../components/home/FeaturedAds';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pb-16"> {/* Add padding-bottom to account for navbar */}
        <CategoryList />
        <TaglineSection />
        <FeaturedAds />
      </main>
      
      <Navbar />
    </div>
  );
};

export default Index;
