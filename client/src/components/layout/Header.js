import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import './Header.css';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const authLinks = (
    <ul>
      <li>
        <Link to="/profile">Profile</Link>
      </li>
      {user && user.role === 'admin' && (
        <li>
          <Link to="/admin">Administration</Link>
        </li>
      )}
      <li>
        <a href="#!" onClick={handleLogout}>
          Logout
        </a>
      </li>
    </ul>
  );

  const guestLinks = (
    <ul>
      <li>
        <Link to="/register">Register</Link>
      </li>
      <li>
        <Link to="/login">Login</Link>
      </li>
    </ul>
  );

  return (
    <header className="header blue-bg">
      <div className="container">
        <div className="logo">
          <Link to="/">
            <h1>WizCTF</h1>
          </Link>
        </div>
        <nav>
          {isAuthenticated ? authLinks : guestLinks}
        </nav>
      </div>
    </header>
  );
};

export default Header;