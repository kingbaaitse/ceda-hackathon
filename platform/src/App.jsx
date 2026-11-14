import React, { Suspense, lazy, useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { loadSupabase } from './lib/supabase-client';

import Landing from './pages/Landing';
import { ToastProvider } from './context/ToastContext';
import { FullscreenLoader } from './components/Loader';

/* Every route that is not the landing page is split out of the entry chunk.
   A first-time visitor used to download the admin portal, the phone-number
   metadata and the flag set just to read the home page. */
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Team = lazy(() => import('./pages/Team'));
const Legal = lazy(() => import('./pages/Legal'));
const Changelog = lazy(() => import('./pages/Changelog'));
const ParticipantPortal = lazy(() => import('./portals/participant/ParticipantPortal'));
const JudgePortal = lazy(() => import('./portals/judge/JudgePortal'));
const AdminPortal = lazy(() => import('./portals/admin/AdminPortal'));

function getPageFromUrl() {
    const path = window.location.pathname.slice(1).replace(/\/$/, '');
    if (path === '') return 'landing';
    if (path === 'signup') return 'signup';
    if (path === 'gallery') return 'gallery';
    if (path === 'changelog') return 'changelog';
    if (path === 'team') return 'team';
    if (['privacy', 'terms', 'data-protection', 'accessibility'].includes(path)) return `legal:${path}`;
    if (['login', 'admin', 'judge', 'participant'].includes(path)) return 'login';
    return 'landing';
}

/* A page-shaped placeholder so a split route never collapses the layout. */
function PageFallback() {
    return <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]" aria-busy="true" />;
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

    // The landing page is both the marketing page and the portal entry, so it
    // waits for the session - but only when one is actually stored.
    if (page === 'landing' && loading) {
        return <FullscreenLoader />;
    }

    // Public marketing pages stay reachable whether or not you are signed in.
    if (page === 'gallery') return <Suspense fallback={<PageFallback />}><Gallery onBack={() => navigate('landing')} /></Suspense>;
    if (page === 'changelog') return <Suspense fallback={<PageFallback />}><Changelog onBack={() => navigate('landing')} /></Suspense>;
    if (page === 'team') return <Suspense fallback={<PageFallback />}><Team onSignIn={() => navigate('login')} onRegister={() => navigate('signup')} /></Suspense>;
    if (page.startsWith('legal:')) {
        return (
            <Suspense fallback={<PageFallback />}>
                <Legal slug={page.split(':')[1]} onSignIn={() => navigate('login')} onRegister={() => navigate('signup')} />
            </Suspense>
        );
    }

    if (!user) {
        if (page === 'signup') return <Suspense fallback={<PageFallback />}><Signup onLogin={() => navigate('login')} onLanding={() => navigate('landing')} /></Suspense>;
        if (page === 'landing') {
            return <Landing onSignIn={() => navigate('login')} onRegister={() => navigate('signup')} />;
        }
        return <Suspense fallback={<PageFallback />}><Login onSignup={() => navigate('signup')} onLanding={() => navigate('landing')} /></Suspense>;
    }

    // Signed in and asking for the landing page: go straight to the portal.
    if (page === 'landing') {
        const role = profile?.role || 'participant';
        const Portal = role === 'admin' ? AdminPortal : role === 'judge' ? JudgePortal : ParticipantPortal;
        return <Suspense fallback={<FullscreenLoader />}><Portal key={role} onLogout={logout} /></Suspense>;
    }

    // Signed in: render the portal matching the user's role.
    const role = profile?.role || 'participant';
    const Portal = role === 'admin' ? AdminPortal : role === 'judge' ? JudgePortal : ParticipantPortal;
    return <Suspense fallback={<FullscreenLoader />}><Portal key={role} onLogout={logout} /></Suspense>;
}

export default function App() {
    // Clear any stale OAuth/hash fragments from the shared Supabase project.
    useEffect(() => {
        if (window.location.hash.includes('access_token=')) {
            loadSupabase().then((supabase) => supabase.auth.getSession());
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
