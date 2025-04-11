import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.js';
import './NotFoundPage.css';

const NotFoundPage = () => {
  return (
    <MainLayout>
      <div className="not-found-container">
        <h1 className="not-found-title">404</h1>
        <h2>Page Not Found</h2>
        <p>The page you are looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn">
          Go to Homepage
        </Link>
      </div>
    </MainLayout>
  );
};

export default NotFoundPage;