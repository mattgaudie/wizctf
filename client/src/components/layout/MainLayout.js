import React from 'react';
import Header from './Header';
import Footer from './Footer';
import './MainLayout.css';

const MainLayout = ({ children }) => {
  return (
    <div className="layout">
      <Header />
      <main className="main-content">
        <div className="container">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;