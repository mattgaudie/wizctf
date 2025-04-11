import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import './Auth.css';

const Login = () => {
  const { login, isAuthenticated, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [alert, setAlert] = useState({
    msg: '',
    type: ''
  });

  const { email, password } = formData;

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
    
    login(formData);
  };

  return (
    <div className="auth-container">
      <div className="auth-card card">
        <h1 className="text-center">Login</h1>
        
        {alert.msg && (
          <div className={`alert alert-${alert.type}`}>
            {alert.msg}
          </div>
        )}
        
        <form onSubmit={onSubmit}>
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
            />
          </div>
          
          <input type="submit" className="btn btn-block" value="Login" />
        </form>
        
        <p className="my-1 text-center">
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;