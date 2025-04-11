// client/src/pages/AdminPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import * as adminService from '../services/admin.service.js';
import * as userService from '../services/user.service.js';
import MainLayout from '../components/layout/MainLayout.js';
import './AdminPage.css';

const AdminPage = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [alert, setAlert] = useState({
    msg: '',
    type: ''
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    organization: '',
    jobTitle: '',
    role: 'user'
  });
  const [isEdit, setIsEdit] = useState(false);

  const { firstName, lastName, email, password, organization, jobTitle, role } = formData;

  useEffect(() => {
    // Redirect if not authenticated or not admin
    if (!loading && (!isAuthenticated || (user && user.role !== 'admin'))) {
      navigate('/dashboard');
      return;
    }

    // Fetch users
    if (isAuthenticated && user && user.role === 'admin') {
      fetchUsers();
    }
  }, [isAuthenticated, loading, navigate, user]);

  const fetchUsers = async () => {
    try {
      const data = await adminService.getAllUsers();
      setUsers(data);
    } catch (err) {
      setAlert({ msg: err.response?.data?.msg || 'Error fetching users', type: 'danger' });
    }
  };

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      organization: '',
      jobTitle: '',
      role: 'user'
    });
    setIsEdit(false);
    setSelectedUser(null);
  };

  const onSelectUser = (user) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      password: '',
      organization: user.organization || '',
      jobTitle: user.jobTitle || '',
      role: user.role || 'user'
    });
    setIsEdit(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isEdit && selectedUser) {
        // Update existing user
        const updateData = {
          firstName,
          lastName,
          organization,
          jobTitle,
          role
        };
        
        await adminService.updateUser(selectedUser._id, updateData);
        setAlert({ msg: 'User updated successfully', type: 'success' });
      } else {
        // Create new user
        await adminService.createUser(formData);
        setAlert({ msg: 'User created successfully', type: 'success' });
      }
      
      // Refresh users list
      fetchUsers();
      resetForm();
    } catch (err) {
      setAlert({ msg: err.response?.data?.msg || 'Error processing user', type: 'danger' });
    }
  };

  const onDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.deleteUser(userId);
        setAlert({ msg: 'User deleted successfully', type: 'success' });
        
        // Refresh users list
        fetchUsers();
        resetForm();
      } catch (err) {
        setAlert({ msg: err.response?.data?.msg || 'Error deleting user', type: 'danger' });
      }
    }
  };

  if (loading || !user) {
    return (
      <MainLayout>
        <div className="admin-loading">
          <h2>Loading...</h2>
        </div>
      </MainLayout>
    );
  }

  // Only allow admin users
  if (user.role !== 'admin') {
    return (
      <MainLayout>
        <div className="admin-unauthorized">
          <h2>Unauthorized Access</h2>
          <p>You don't have permission to view this page.</p>
          <button className="btn" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="admin-container">
        <h1>Administration</h1>

        {alert.msg && (
          <div className={`alert alert-${alert.type}`}>
            {alert.msg}
          </div>
        )}

        <div className="admin-grid">
          <div className="admin-section card">
            <h2>{isEdit ? 'Edit User' : 'Create User'}</h2>
            <form onSubmit={onSubmit}>
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
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={onChange}
                  required
                  disabled={isEdit}
                />
              </div>

              {!isEdit && (
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={password}
                    onChange={onChange}
                    required={!isEdit}
                    minLength="6"
                  />
                  <small className="form-text">
                    Minimum 6 characters
                  </small>
                </div>
              )}

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

              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={role}
                  onChange={onChange}
                  required
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="admin-form-buttons">
                <button type="submit" className="btn">
                  {isEdit ? 'Update User' : 'Create User'}
                </button>
                {isEdit && (
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="admin-section card">
            <h2>User Management</h2>
            <div className="admin-users-list">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user._id}>
                        <td>{user.firstName} {user.lastName}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>
                          <button
                            className="btn btn-sm"
                            onClick={() => onSelectUser(user)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => onDelete(user._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4">No users found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminPage;