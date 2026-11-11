/**
 * ═══════════════════════════════════════════════════════════════
 *  CEDA Innovation Hub — Shared Portal Layout
 *  Floating Pill Design (same layout system as hmcp MamaLink)
 * ═══════════════════════════════════════════════════════════════
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu, X, Bell, LogOut, Settings, ChevronRight,
    Search, ChevronLeft, Mail, WifiOff, User, Check
} from 'lucide-react';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import ModalSheet from './ui/ModalSheet';
import ActiveSessions from '@/components/block/active-sessions';
import { parseUserAgent } from '../lib/device';
import { supabase } from '../lib/supabase';

/* Live notifications for the signed-in user: initial fetch + realtime
   INSERTs from the ceda_notifications publication. Mark-read on open. */
function useNotifications(userId) {
    const [items, setItems] = useState([]);
    const [unread, setUnread] = useState(0);

    const load = useCallback(async () => {
        if (!userId) return;
        const { data } = await supabase
            .from('ceda_notifications')
            .select('*')
            .eq('user_id', userId)          // admins can read all rows, but the bell is personal
            .order('created_at', { ascending: false })
            .limit(30);
        setItems(data || []);
        setUnread((data || []).filter(n => !n.read).length);
    }, [userId]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (!userId) return;
        const channel = supabase
            .channel(`ceda-notifs-${userId.slice(0, 8)}`)
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'ceda_notifications', filter: `user_id=eq.${userId}` },
                () => load())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [userId, load]);

    const markAllRead = useCallback(async () => {
        if (unread === 0) return;
        setUnread(0);
        setItems(list => list.map(n => ({ ...n, read: true })));
        await supabase.from('ceda_notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
    }, [userId, unread]);

    return { items, unread, markAllRead };
}

/* ─── Sidebar Item ───────────────────────────────────────────── */
const SidebarItem = ({ icon: Icon, label, active, onClick, badge, collapsed }) => (
    <motion.button
        whileHover={{ x: collapsed ? 0 : 3 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        title={collapsed ? label : undefined}
        transition={{ type: 'spring', stiffness: 600, damping: 40 }}
        className={`w-full flex items-center gap-3 px-3 py-3 rounded-full transition-colors relative group overflow-hidden text-left ${active
                ? 'text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-500/10'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
            } ${collapsed ? 'justify-center' : ''}`}
        style={{ willChange: 'transform' }}
    >
        {active && (
            <motion.div
                layoutId="portalActiveTab"
                className="absolute inset-0 bg-accent-50 dark:bg-accent-500/10 z-0 rounded-full"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
        )}
        <div className={`relative z-10 flex items-center ${collapsed ? '' : 'gap-3 w-full'}`}>
            <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-accent-500' : 'group-hover:text-accent-500 transition-colors'}`} />
            {!collapsed && (
                <>
                    <span className={`text-sm flex-1 ${active ? 'text-accent-600 dark:text-accent-400' : ''}`}>{label}</span>
                    {badge > 0 && (
                        <span className="w-5 h-5 bg-royal-500 text-white text-[10px] rounded-full flex items-center justify-center">
                            {badge > 9 ? '9+' : badge}
                        </span>
                    )}
                </>
            )}
        </div>
    </motion.button>
);

/* ─── Portal Layout ──────────────────────────────────────────── */
export default function PortalLayout({
    portalName = 'CEDA Innovation Hub',
    navItems = [],
    activeTab,
    onTabChange,
    userName = 'User',
    userRole = '',
    userId,
    onSearch,
    onLogout,
    headerActions,
    children,
}) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [logoHovered, setLogoHovered] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [emailOptIn, setEmailOptIn] = useState(true);
    const [savingPrefs, setSavingPrefs] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [sessionsError, setSessionsError] = useState('');
    const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
    const { items: notifications, unread, markAllRead } = useNotifications(userId);

    useEffect(() => {
        const up = () => setOnline(true);
        const down = () => setOnline(false);
        window.addEventListener('online', up);
        window.addEventListener('offline', down);
        return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
    }, []);

    /* Load + save the email alert preference */
    const loadPrefs = useCallback(async () => {
        if (!userId) return;
        const { data } = await supabase.from('ceda_profiles').select('email_opt_in').eq('id', userId).maybeSingle();
        if (data) setEmailOptIn(data.email_opt_in !== false);
    }, [userId]);

    useEffect(() => { loadPrefs(); }, [loadPrefs]);

    const toggleEmail = async () => {
        if (!userId) return;
        const next = !emailOptIn;
        setEmailOptIn(next);
        setSavingPrefs(true);
        const { error } = await supabase.from('ceda_profiles').update({ email_opt_in: next }).eq('id', userId);
        setSavingPrefs(false);
        if (error) setEmailOptIn(!next);
    };

    /* Active sessions (real: backed by auth.sessions via RPC) */
    const loadSessions = useCallback(async () => {
        if (!userId) return;
        setSessionsLoading(true);
        setSessionsError('');
        const { data, error } = await supabase.rpc('ceda_list_sessions');
        if (error) {
            setSessionsError('Session list is unavailable right now.');
            setSessions([]);
        } else {
            setSessions((data || []).map(s => {
                const ua = parseUserAgent(s.user_agent);
                return {
                    id: s.id,
                    device: ua.device,
                    browser: ua.browser,
                    os: ua.os,
                    ip: s.ip,
                    lastActiveAt: s.updated_at,
                    current: !!s.current,
                };
            }));
        }
        setSessionsLoading(false);
    }, [userId]);

    useEffect(() => { if (showSettings) loadSessions(); }, [showSettings, loadSessions]);

    const revokeSession = useCallback(async (session) => {
        const { data, error } = await supabase.rpc('ceda_revoke_session', { session_id: session.id });
        if (error || data === false) throw new Error('Sign-out failed. Please try again.');
        await loadSessions();
    }, [loadSessions]);

    const revokeOtherSessions = useCallback(async () => {
        const { error } = await supabase.rpc('ceda_revoke_other_sessions');
        if (error) throw new Error('Sign-out failed. Please try again.');
        await loadSessions();
    }, [loadSessions]);

    /* Header search feeds the portal's filter (debounced so typing stays smooth) */
    useEffect(() => {
        if (!onSearch) return;
        const t = setTimeout(() => onSearch(searchQuery), 200);
        return () => clearTimeout(t);
    }, [searchQuery, onSearch]);

    const sidebarWidth = collapsed ? 76 : 280;
    const gap = 24;

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-[#0a0a0a] overflow-hidden transition-colors duration-300">

            {/* ══════════════ FLOATING PILL SIDEBAR (LEFT) ══════════════ */}
            <motion.aside
                animate={{ width: sidebarWidth }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="hidden lg:flex flex-col fixed left-6 top-6 bottom-6 z-30 glass-panel-strong"
                style={{ borderRadius: 34, willChange: 'width' }}
            >
                {/* Logo / Brand */}
                <div
                    className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-5 border-b border-gray-100 dark:border-white/5`}
                >
                    <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} flex-1 min-w-0`}>
                        {collapsed ? (
                            <button
                                onClick={() => setCollapsed(false)}
                                onMouseEnter={() => setLogoHovered(true)}
                                onMouseLeave={() => setLogoHovered(false)}
                                className="relative w-10 h-10 flex items-center justify-center flex-shrink-0"
                            >
                                <motion.div
                                    animate={{ scale: logoHovered ? 0.4 : 1, opacity: logoHovered ? 0 : 1, rotate: logoHovered ? -90 : 0 }}
                                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                                    className="absolute inset-0 flex items-center justify-center"
                                >
                                    <Logo className="w-7 h-7" />
                                </motion.div>
                                <motion.div
                                    animate={{ scale: logoHovered ? 1 : 0.4, opacity: logoHovered ? 1 : 0, rotate: logoHovered ? 0 : 90 }}
                                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                                    className="absolute inset-0 flex items-center justify-center"
                                >
                                    <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300 -rotate-180" />
                                </motion.div>
                            </button>
                        ) : (
                            <>
                                <Logo className="w-7 h-7 flex-shrink-0" />
                                <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="text-sm text-gray-900 dark:text-white tracking-tight whitespace-nowrap overflow-hidden"
                                >
                                    {portalName}
                                </motion.span>
                            </>
                        )}
                    </div>

                    {!collapsed && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setCollapsed(true)}
                            className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex-shrink-0 ml-2"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </motion.button>
                    )}
                </div>

                {/* Nav Items */}
                <nav className="flex-1 px-3 pt-4 space-y-0.5 overflow-y-auto scrollbar-hide">
                    {navItems.map(item => (
                        <SidebarItem
                            key={item.id}
                            icon={item.icon}
                            label={item.label}
                            active={activeTab === item.id}
                            onClick={() => onTabChange(item.id)}
                            badge={item.badge}
                            collapsed={collapsed}
                        />
                    ))}
                </nav>

                {/* Bottom Actions */}
                <div className="p-3 border-t border-gray-100 dark:border-white/5 space-y-0.5">
                    <SidebarItem icon={Settings} label="Settings" onClick={() => setShowSettings(true)} collapsed={collapsed} />
                    <motion.button
                        whileHover={{ x: collapsed ? 0 : 3 }} whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 600, damping: 40 }}
                        onClick={() => setShowLogoutConfirm(true)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors ${collapsed ? 'justify-center' : ''}`}
                        style={{ willChange: 'transform' }}
                    >
                        <LogOut className="w-5 h-5" />
                        {!collapsed && <span className="text-sm">Sign Out</span>}
                    </motion.button>
                </div>
            </motion.aside>

            {/* ══════════════ Mobile Overlay ══════════════ */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* ══════════════ Mobile Sidebar ══════════════ */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.aside
                        initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed left-0 top-0 bottom-0 w-[85%] max-w-[320px] glass-panel-strong z-50 lg:hidden flex flex-col"
                        style={{ borderRadius: 0, borderRight: '1px solid var(--glass-border)' }}
                    >
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <Logo className="w-7 h-7" />
                                <span className="text-lg text-gray-900 dark:text-white">{portalName}</span>
                            </div>
                            <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-gray-100 dark:bg-white/5 rounded-full text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                            {navItems.map(item => (
                                <SidebarItem
                                    key={item.id}
                                    icon={item.icon}
                                    label={item.label}
                                    active={activeTab === item.id}
                                    onClick={() => { onTabChange(item.id); setMobileMenuOpen(false); }}
                                    badge={item.badge}
                                />
                            ))}
                        </nav>

                        <div className="p-3 border-t border-gray-100 dark:border-white/5">
                            <button onClick={() => setShowLogoutConfirm(true)}
                                className="w-full flex items-center gap-3 px-3 py-3 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 text-sm mt-1"
                            >
                                <LogOut className="w-5 h-5" /> Sign Out
                            </button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* ══════════════ Main Content Area ══════════════ */}
            <main
                className="flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 pt-6 pb-6 pl-0 lg:ml-[var(--sidebar-width)]"
                style={{ '--sidebar-width': `${sidebarWidth + gap}px` }}
            >
                {/* ── Floating Pill Top Header ── */}
                <header
                    className="glass-panel-strong flex items-center justify-between mx-6 px-5 h-14 sticky top-0 z-10"
                    style={{ borderRadius: 9999 }}
                >
                    <div className="flex items-center gap-3">
                        <button onClick={() => setMobileMenuOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full">
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Search */}
                        <div className="hidden md:flex items-center gap-2 field-fill rounded-full px-3 py-1.5 w-56 lg:w-72">
                            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 outline-none w-full"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {!online && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 text-xs">
                                <WifiOff className="w-3.5 h-3.5" /> Offline
                            </span>
                        )}
                        {headerActions}

                        {/* Theme Toggle — lives in header */}
                        <ThemeToggle />

                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => { setShowNotifications(v => !v); if (!showNotifications) setTimeout(markAllRead, 600); }}
                                className="relative p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
                            >
                                <Bell className="w-5 h-5" />
                                {unread > 0 && (
                                    <span className="absolute top-1 right-1 w-4 h-4 bg-royal-500 text-white text-[9px] rounded-full flex items-center justify-center">
                                        {unread > 9 ? '9+' : unread}
                                    </span>
                                )}
                            </button>

                            <AnimatePresence>
                                {showNotifications && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                                        className="absolute top-full right-0 mt-2 w-80 glass-panel-strong rounded-2xl shadow-2xl overflow-hidden z-50"
                                    >
                                        <div className="p-4 border-b border-gray-100 dark:border-white/5">
                                            <h3 className="text-gray-900 dark:text-white text-sm">Notifications</h3>
                                        </div>
                                        <div className="max-h-72 overflow-y-auto scrollbar-hide">
                                            {notifications.length === 0 ? (
                                                <div className="p-6 text-center text-gray-400 text-sm">No notifications yet — pipeline updates land here.</div>
                                            ) : (
                                                notifications.map(n => (
                                                    <a
                                                        key={n.id}
                                                        href={n.link || '#'}
                                                        onClick={() => setShowNotifications(false)}
                                                        className={`p-3 hover:bg-gray-50 dark:hover:bg-white/5 flex gap-3 ${!n.read ? 'bg-accent-50/50 dark:bg-accent-500/5' : ''}`}
                                                    >
                                                        <span className={`w-1.5 rounded-full flex-shrink-0 ${n.type === 'gate' ? 'bg-amber-400' : n.type === 'evaluation' ? 'bg-accent-500' : 'bg-sky-400'}`} />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-gray-900 dark:text-white truncate">{n.title}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.body}</p>
                                                            <p className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                                                        </div>
                                                    </a>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* ── Profile Circle Button ── */}
                        <div className="flex items-center gap-2.5 pl-2 pr-1">
                            <div className="hidden sm:block text-right">
                                <p className="text-xs text-gray-900 dark:text-white leading-none">{userName}</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 capitalize">{userRole}</p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-accent-500 flex items-center justify-center overflow-hidden ring-2 ring-white dark:ring-[#0a0a0a]">
                                <span className="text-white text-sm">
                                    {userName?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* ── Scrollable Content ── */}
                <div className="flex-1 overflow-y-auto scrollbar-hide scroll-fade-edges" onClick={() => setShowNotifications(false)}>
                    <div className="px-6 pt-6 pb-28 lg:pb-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                            >
                                {children}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            {/* ══════════════ Settings Sheet ══════════════ */}
            <ModalSheet
                open={showSettings}
                onClose={() => setShowSettings(false)}
                title="Settings"
                subtitle="Your account and notification preferences"
                maxWidth="max-w-md"
            >
                <div className="space-y-5">
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-white/5">
                        <div className="w-10 h-10 rounded-full bg-accent-500 flex items-center justify-center text-white">
                            <User className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm text-gray-900 dark:text-white truncate">{userName}</p>
                            <p className="text-xs text-gray-400 capitalize">{userRole}</p>
                        </div>
                    </div>

                    <div className="flex items-start justify-between gap-4 p-4 rounded-2xl border border-gray-100 dark:border-white/10">
                        <div className="flex gap-3 min-w-0">
                            <Mail className="w-4 h-4 text-accent-500 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="text-sm text-gray-900 dark:text-white">Email alerts</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Send pipeline updates (gate decisions, evaluations, messages) to your inbox as well as in-app.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={toggleEmail}
                            disabled={savingPrefs}
                            role="switch"
                            aria-checked={emailOptIn}
                            aria-label="Email alerts"
                            className={`w-11 h-6 rounded-full flex-shrink-0 transition-colors relative mt-0.5 ${emailOptIn ? 'bg-accent-500' : 'bg-gray-300 dark:bg-white/15'}`}
                        >
                            <motion.span
                                layout
                                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow flex items-center justify-center ${emailOptIn ? 'left-[22px]' : 'left-0.5'}`}
                            >
                                {emailOptIn && <Check className="w-3 h-3 text-accent-600" />}
                            </motion.span>
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-white/10">
                        <div>
                            <p className="text-sm text-gray-900 dark:text-white">Appearance</p>
                            <p className="text-xs text-gray-400 mt-0.5">Light, dark or system</p>
                        </div>
                        <ThemeToggle />
                    </div>

                    {/* Active sessions */}
                    <div className="pt-2 border-t border-gray-100 dark:border-white/10">
                        {sessionsError ? (
                            <p className="text-xs text-gray-400">{sessionsError}</p>
                        ) : (
                            <ActiveSessions
                                sessions={sessions}
                                onSessionsChange={setSessions}
                                onRevoke={revokeSession}
                                onRevokeOthers={revokeOtherSessions}
                                loading={sessionsLoading}
                                heading="Active sessions"
                                description="Devices signed in to your account. Revoke a session to sign that device out immediately."
                            />
                        )}
                    </div>
                </div>
            </ModalSheet>

            {/* ══════════════ Logout Confirmation ══════════════ */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4"
                        onClick={() => setShowLogoutConfirm(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-[#161616] border border-gray-100 dark:border-white/10 rounded-3xl p-6 max-w-sm w-full"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-gray-900 dark:text-white text-lg">Sign Out</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Are you sure you want to sign out?</p>
                            <div className="flex gap-2 mt-5 justify-end">
                                <button className="btn-secondary !py-2.5 !px-5 !text-sm" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
                                <button className="btn-danger !py-2.5 !px-5 !text-sm" onClick={onLogout}>Sign Out</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
