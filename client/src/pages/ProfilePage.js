import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import * as userService from '../services/user.service.js';
import * as authService from '../services/auth.service.js';
import MainLayout from '../components/layout/MainLayout.js';
import './ProfilePage.css';

const ProfilePage = () => {
  const { isAuthenticated, user, loading, updateUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    organization: '',
    jobTitle: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [alert, setAlert] = useState({
    msg: '',
    type: ''
  });

  useEffect(() => {
    // Redirect if not authenticated
    if (!loading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    // Populate form with user data
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        organization: user.organization || '',
        jobTitle: user.jobTitle || '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
    }
  }, [isAuthenticated, loading, navigate, user]);

  const { firstName, lastName, organization, jobTitle, currentPassword, newPassword, confirmNewPassword } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onFileChange = (e) => {
    setProfilePicture(e.target.files[0]);
  };

  const onProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await userService.updateProfile({
        firstName,
        lastName,
        organization,
        jobTitle
      });

      updateUser(res);
      setAlert({ msg: 'Profile updated successfully', type: 'success' });
    } catch (err) {
      setAlert({ msg: err.response?.data?.msg || 'Error updating profile', type: 'danger' });
    }
  };

  const onPasswordSubmit = async (e) => {
    e.preventDefault();

    // Check if passwords match
    if (newPassword !== confirmNewPassword) {
      setAlert({ msg: 'New passwords do not match', type: 'danger' });
      return;
    }

    try {
      // Use our auth service API
      await authService.resetPassword({
        currentPassword,
        newPassword
      });

      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });

      setAlert({ msg: 'Password updated successfully', type: 'success' });
    } catch (err) {
      setAlert({ msg: err.response?.data?.msg || 'Error updating password', type: 'danger' });
    }
  };

  const onPictureSubmit = async (e) => {
    e.preventDefault();

    if (!profilePicture) {
      setAlert({ msg: 'Please select an image', type: 'danger' });
      return;
    }

    const formData = new FormData();
    formData.append('profilePicture', profilePicture);

    try {
      const res = await userService.uploadProfilePicture(formData);

      updateUser(res);
      setAlert({ msg: 'Profile picture updated successfully', type: 'success' });
      setProfilePicture(null);
      // Reset file input
      document.getElementById('profilePicture').value = '';
    } catch (err) {
      setAlert({ msg: err.response?.data?.msg || 'Error uploading profile picture', type: 'danger' });
    }
  };

  if (loading || !user) {
    return (
      <MainLayout>
        <div className="profile-loading">
          <h2>Loading...</h2>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="profile-container">
        <h1>Profile</h1>

        {alert.msg && (
          <div className={`alert alert-${alert.type}`}>
            {alert.msg}
          </div>
        )}

        <div className="profile-grid">
          <div className="profile-section card">
            <h2>Profile Picture</h2>
            <div className="profile-picture-container">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Profile"
                  className="profile-picture"
                />
              ) : (
                <div className="profile-picture-placeholder">
                  {user.firstName && user.lastName
                    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
                    : 'User'}
                </div>
              )}
            </div>
            <form onSubmit={onPictureSubmit}>
              <div className="form-group">
                <input
                  type="file"
                  id="profilePicture"
                  name="profilePicture"
                  onChange={onFileChange}
                  accept="image/jpeg,image/png,image/gif"
                />
                <small className="form-text">
                  Only JPG, PNG, and GIF formats are allowed (max 5MB)
                </small>
              </div>
              <button type="submit" className="btn">
                Upload Picture
              </button>
            </form>
          </div>

          <div className="profile-section card">
            <h2>Personal Information</h2>
            <form onSubmit={onProfileSubmit}>
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={firstName}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={lastName}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="organization">Organization</label>
                <input
                  type="text"
                  id="organization"
                  name="organization"
                  value={organization}
                  onChange={onChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="jobTitle">Job Title</label>
                <input
                  type="text"
                  id="jobTitle"
                  name="jobTitle"
                  value={jobTitle}
                  onChange={onChange}
                />
              </div>

              <button type="submit" className="btn">
                Update Profile
              </button>
            </form>
          </div>

          <div className="profile-section card">
            <h2>Change Password</h2>
            <form onSubmit={onPasswordSubmit}>
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={currentPassword}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={newPassword}
                  onChange={onChange}
                  required
                  minLength="6"
                />
                <small className="form-text">
                  Minimum 6 characters
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmNewPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  value={confirmNewPassword}
                  onChange={onChange}
                  required
                  minLength="6"
                />
              </div>

              <button type="submit" className="btn">
                Change Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;