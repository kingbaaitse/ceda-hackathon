import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader2, Lightbulb } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const Login = ({ onSignup }) => {
    const { login, resetPassword } = useAuth();

    const [mode, setMode] = useState('login'); // 'login' | 'forgot'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resetSent, setResetSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email, password);
            // onAuthStateChange in AuthContext sets user — App redirects to portal
        } catch (err) {
            setError(err.message || 'Incorrect email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!email) { setError('Please enter your email address first.'); return; }
        setLoading(true);
        setError('');
        try {
            await resetPassword(email);
            setResetSent(true);
        } catch (err) {
            setError(err.message || 'Failed to send reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen transition-colors duration-300">
            {/* Left: Brand Cover Panel - identical to the signup panel */}
            <div className="hidden lg:flex w-1/2 bg-royal-900 relative items-center justify-center overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 bg-gradient-to-br from-royal-900 via-royal-800 to-accent-950"
                />
                <div className="relative z-10 px-16 max-w-xl">
                    <div className="flex items-center gap-3 mb-8">
                        <Logo className="w-12 h-12" />
                        <span className="text-white text-2xl tracking-tight">CEDA Innovation Hub</span>
                    </div>
                    <h1 className="text-white text-5xl leading-tight tracking-tight">
                        One submission. <span className="font-serif-italic text-5xl text-accent-300">Every gate.</span>
                    </h1>
                    <p className="text-white/70 text-lg mt-6 leading-relaxed">
                        Sign in to continue your innovation through screening, evaluation and
                        award — with feedback at every stage.
                    </p>
                </div>
            </div>

            {/* Right: Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-[#0a0a0a]">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md"
                >
                    <div className="flex items-center gap-3 mb-8 lg:hidden">
                        <Logo className="w-8 h-8" />
                        <span className="text-gray-900 dark:text-white text-lg">CEDA Innovation Hub</span>
                    </div>

                    {mode === 'login' ? (
                        <>
                            <h2 className="text-gray-900 dark:text-white text-3xl tracking-tight">Welcome back</h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">
                                Sign in to your innovation portal.
                            </p>
                            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                                <div className="relative">
                                    <Mail className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 z-10" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Email address"
                                        className="w-full rounded-full field-fill py-3.5 pl-11 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400"
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 z-10" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Password"
                                        className="w-full rounded-full field-fill py-3.5 pl-11 pr-11 text-sm text-gray-900 dark:text-white placeholder-gray-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                {error && (
                                    <p className="text-royal-600 dark:text-royal-400 text-sm px-2">{error}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-accent w-full disabled:opacity-60"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                    Sign In
                                </button>

                                <div className="flex items-center justify-between pt-2 px-2">
                                    <button
                                        type="button"
                                        onClick={() => { setMode('forgot'); setError(''); }}
                                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400"
                                    >
                                        Forgot password?
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onSignup}
                                        className="text-sm text-accent-600 dark:text-accent-400 hover:underline"
                                    >
                                        Create account
                                    </button>
                                </div>
                                <a
                                    href="/gallery"
                                    className="block text-center text-xs text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 mt-4"
                                >
                                    Explore the Awards Gallery →
                                </a>
                            </form>
                        </>
                    ) : (
                        <>
                            <h2 className="text-gray-900 dark:text-white text-3xl tracking-tight">Reset password</h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">
                                {resetSent
                                    ? 'Check your inbox — a reset link is on its way.'
                                    : 'Enter your email and we will send you a reset link.'}
                            </p>
                            {!resetSent && (
                                <form onSubmit={handleForgotPassword} className="mt-8 space-y-4">
                                    <div className="relative">
                                        <Mail className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 z-10" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Email address"
                                            className="w-full rounded-full field-fill py-3.5 pl-11 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400"
                                        />
                                    </div>
                                    {error && <p className="text-royal-600 dark:text-royal-400 text-sm px-2">{error}</p>}
                                    <button type="submit" disabled={loading} className="btn-accent w-full disabled:opacity-60">
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                        Send Reset Link
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setMode('login'); setResetSent(false); }}
                                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 px-2"
                                    >
                                        ← Back to sign in
                                    </button>
                                </form>
                            )}
                            {resetSent && (
                                <button
                                    type="button"
                                    onClick={() => { setMode('login'); setResetSent(false); }}
                                    className="btn-secondary mt-8"
                                >
                                    ← Back to sign in
                                </button>
                            )}
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
