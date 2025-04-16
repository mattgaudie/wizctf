import React, { useState, useEffect, useRef } from 'react';
import './Footer.css';

const Footer = () => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { innerHeight } = window;
      
      // Clear existing timeout when mouse moves
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Check if mouse is at the bottom of the page
      if (innerHeight - clientY < 50) {
        // Start timer if mouse is at bottom
        timeoutRef.current = setTimeout(() => {
          // Only trigger if mouse hasn't moved significantly
          if (Math.abs(mousePositionRef.current.x - clientX) < 10 && 
              Math.abs(mousePositionRef.current.y - clientY) < 10) {
            setIsVisible(true);
          }
        }, 1000); // Show after 1 second hover
      } else {
        setIsVisible(false);
      }
      
      // Store the current mouse position
      mousePositionRef.current = { x: clientX, y: clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <footer className={`footer blue-bg ${isVisible ? 'visible' : ''}`}>
      <div className="container">
        <p>&copy; {new Date().getFullYear()} Wiz. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;