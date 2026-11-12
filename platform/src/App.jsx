import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Gallery from './pages/Gallery';
import Landing from './pages/Landing';
import Team from './pages/Team';
import Changelog from './pages/Changelog';
import ParticipantPortal from './portals/participant/ParticipantPortal';
import JudgePortal from './portals/judge/JudgePortal';
import AdminPortal from './portals/admin/AdminPortal';
import { ToastProvider } from './context/ToastContext';

function getPageFromUrl() {
  const path = window.location.pathname.slice(1).replace(/\/$/, '');
  if (path === '') return 'landing';
  if (path === 'signup') return 'signup';
  if (path === 'gallery') return 'gallery';
  if (path === 'changelog') return 'changelog';
  if (path === 'team') return 'team';
  if (['login', 'admin', 'judge', 'participant'].includes(path)) return 'login';
  return 'landing';
}

function Shell() {
  const { user, profile, loading, logout } = useAuth();
  const [page, setPage] = useState(getPageFromUrl());

  useEffect(() => {
    const onPop = () => setPage(getPageFromUrl());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (p) => {
    window.history.pushState({}, '', p === 'login' ? '/' : `/${p}`);
    setPage(p);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="w-8 h-8 rounded-full border-2 border-accent-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Public marketing pages stay reachable whether or not you are signed in.
  if (page === 'gallery') return <Gallery onBack={() => navigate('landing')} />;
  if (page === 'changelog') return <Changelog onBack={() => navigate('landing')} />;
  if (page === 'team') return <Team onSignIn={() => navigate('login')} onRegister={() => navigate('signup')} />;

  if (!user) {
    if (page === 'signup') return <Signup onLogin={() => navigate('login')} onLanding={() => navigate('landing')} />;
    if (page === 'landing') {
      return <Landing onSignIn={() => navigate('login')} onRegister={() => navigate('signup')} />;
    }
    return <Login onSignup={() => navigate('signup')} onLanding={() => navigate('landing')} />;
  }

  // Signed in: render the portal matching the user's role.
  const role = profile?.role || 'participant';
  const Portal = role === 'admin' ? AdminPortal : role === 'judge' ? JudgePortal : ParticipantPortal;
  return <Portal key={role} onLogout={logout} />;
}

export default function App() {
  // Clear any stale OAuth/hash fragments from the shared Supabase project.
  useEffect(() => {
    if (window.location.hash.includes('access_token=')) {
      supabase.auth.getSession();
    }
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Shell />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
