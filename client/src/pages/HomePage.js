import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import MainLayout from '../components/layout/MainLayout.js';
import './HomePage.css';

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <MainLayout>
      <div className="home-container">
        <div className="home-content">
          <h1>Welcome to the Wiz CTF Game Server</h1>
          <p>Battle it out against your competitors and become the ultimate Wizard.</p>
          
          {!isAuthenticated ? (
            <div className="home-buttons">
              <Link to="/register" className="btn btn-primary">
                Register
              </Link>
              <Link to="/login" className="btn btn-light">
                Login
              </Link>
            </div>
          ) : (
            <div className="home-buttons">
              <Link to="/dashboard" className="btn btn-primary">
                Dashboard
              </Link>
              <Link to="/profile" className="btn btn-light">
                Profile
              </Link>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default HomePage;