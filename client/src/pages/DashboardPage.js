import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import MainLayout from '../components/layout/MainLayout.js';
import './DashboardPage.css';

const DashboardPage = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not authenticated
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading || !user) {
    return (
      <MainLayout>
        <div className="dashboard-loading">
          <h2>Loading...</h2>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Game Server</h1>
          <p>Welcome, {user.firstName} {user.lastName}</p>
        </div>

        <div className="dashboard-content">
          <div className="card dashboard-card">
            <h2>Your Information</h2>
            <div className="dashboard-info">
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>Organization:</strong> {user.organization || 'Not specified'}
              </p>
              <p>
                <strong>Job Title:</strong> {user.jobTitle || 'Not specified'}
              </p>
              <p>
                <strong>Role:</strong> {user.role}
              </p>
            </div>
          </div>

          <div className="card dashboard-card">
            <h2>Quick Actions</h2>
            <div className="dashboard-actions">
              <button className="btn" onClick={() => navigate('/profile')}>
                Update Profile
              </button>
              {user.role === 'admin' && (
                <button className="btn btn-light" onClick={() => navigate('/admin')}>
                  Admin Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;