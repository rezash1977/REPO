
import React from 'react';
import Header from './Header';
import Navbar from './Navbar';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50">
        {children}
      </main>
      <Navbar />
    </div>
  );
};

export default Layout;
