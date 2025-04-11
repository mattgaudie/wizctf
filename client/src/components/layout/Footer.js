import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer blue-bg">
      <div className="container">
        <p>&copy; {new Date().getFullYear()} Wiz. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;