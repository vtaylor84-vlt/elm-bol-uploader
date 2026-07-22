import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import TerminalLogin from '../components/TerminalLogin.tsx';
import { useAuth } from '../context/AuthContext.tsx';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  if (isAuthenticated && !redirecting) {
    return <Navigate to="/today" replace />;
  }

  return (
    <TerminalLogin
      onLogin={(profile) => {
        login(profile);
        setRedirecting(true);
        navigate('/connecting', { replace: true });
      }}
    />
  );
};

export default LoginPage;
