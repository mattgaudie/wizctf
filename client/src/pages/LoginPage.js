import React from 'react';
import MainLayout from '../components/layout/MainLayout.js';
import Login from '../components/auth/Login.js';

const LoginPage = () => {
  return (
    <MainLayout>
      <Login />
    </MainLayout>
  );
};

export default LoginPage;