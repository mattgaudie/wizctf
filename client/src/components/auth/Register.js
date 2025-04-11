import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import './Auth.css';

const Register = () => {
  const { register, isAuthenticated, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    password2: '',
    organization: '',
    jobTitle: ''
  });

  const [alert, setAlert] = useState({
    msg: '',
    type: ''
  });

  const { firstName, lastName, email, password, password2, organization, jobTitle } = formData;

  useEffect(() => {
    // Redirect if authenticated
    if (isAuthenticated) {
      navigate('/dashboard');
    }

    // Display error if exists
    if (error) {
      setAlert({ msg: error, type: 'danger' });
      clearError();
    }
    // eslint-disable-next-line
  }, [isAuthenticated, error]);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (password !== password2) {
      setAlert({ msg: 'Passwords do not match', type: 'danger' });
      return;
    }
    
    if (password.length < 6) {
      setAlert({ msg: 'Password must be at least 6 characters', type: 'danger' });
      return;
    }
    
    // Register user
    register({
      firstName,
      lastName,
      email,
      password,
      organization,
      jobTitle
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-card card">
        <h1 className="text-center">Register</h1>
        
        {alert.msg && (
          <div className={`alert alert-${alert.type}`}>
            {alert.msg}
          </div>
        )}
        
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <input
              type="text"
              placeholder="First Name"
              name="firstName"
              value={firstName}
              onChange={onChange}
              required
            />
          </div>
          
          <div className="form-group">
            <input
              type="text"
              placeholder="Last Name"
              name="lastName"
              value={lastName}
              onChange={onChange}
              required
            />
          </div>
          
          <div className="form-group">
            <input
              type="email"
              placeholder="Email Address"
              name="email"
              value={email}
              onChange={onChange}
              required
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              name="password"
              value={password}
              onChange={onChange}
              required
              minLength="6"
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              placeholder="Confirm Password"
              name="password2"
              value={password2}
              onChange={onChange}
              required
              minLength="6"
            />
          </div>
          
          <div className="form-group">
            <input
              type="text"
              placeholder="Organization"
              name="organization"
              value={organization}
              onChange={onChange}
            />
          </div>
          
          <div className="form-group">
            <input
              type="text"
              placeholder="Job Title"
              name="jobTitle"
              value={jobTitle}
              onChange={onChange}
            />
          </div>
          
          <input type="submit" className="btn btn-block" value="Register" />
        </form>
        
        <p className="my-1 text-center">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;