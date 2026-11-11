import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader2, Lightbulb } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { FlipText } from '@/components/block/flip-text';
import { DraggableMarquee } from '@/components/block/draggable-marquee';
import { supabase } from '../lib/supabase';

const VPrism = React.lazy(() => import('@/components/block/v-prism'));
const DARK_PRESET = {
    ambientLight: 0.015, pointLights: 0.05, spotIntensity: 1.0, rainbowGlow: 2.5,
    bloom: 0.5, roughness: 0, ior: 1.5, thickness: 0.9,
    background: '#000000', prismTint: '#ffffff',
};

const Login = ({ onSignup }) => {
    const { login, resetPassword } = useAuth();

    const [mode, setMode] = useState('login'); // 'login' | 'forgot'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resetSent, setResetSent] = useState(false);
    const [showcase, setShowcase] = useState([]);

    /* Awarded innovations scroll across the brand panel */
    useEffect(() => {
        supabase
            .from('ceda_submissions')
            .select('title')
            .eq('stage', 'awarded')
            .limit(12)
            .then(({ data }) => setShowcase((data || []).map(s => ({ id: s.title, title: s.title }))));
    }, []);

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
            {/* Left: Brand Cover Panel */}
            <div className="hidden lg:flex w-[46%] xl:w-1/2 relative overflow-hidden bg-[#160b09]">
                {/* brand backdrop */}
                <div
                    className="absolute inset-0"
                    style={{ background: 'radial-gradient(760px 420px at 12% 6%, rgba(242,101,34,0.30), transparent 68%), radial-gradient(620px 340px at 92% 96%, rgba(160,32,19,0.34), transparent 70%), linear-gradient(160deg, #2a0f0a 0%, #160b09 55%, #12080a 100%)' }}
                />
                {/* subtle dot grid */}
                <div
                    className="absolute inset-0 opacity-[0.07]"
                    style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '22px 22px' }}
                />
                <div
                    className="absolute -right-24 -top-16 w-[460px] h-[460px] pointer-events-none"
                    style={{
                        maskImage: 'radial-gradient(circle at 62% 38%, black 34%, transparent 70%)',
                        WebkitMaskImage: 'radial-gradient(circle at 62% 38%, black 34%, transparent 70%)',
                    }}
                >
                    <React.Suspense fallback={null}>
                        <VPrism settings={DARK_PRESET} />
                    </React.Suspense>
                </div>

                <div className="relative z-10 flex flex-col justify-between px-14 py-14 w-full max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.6 }}
                    >
                        <div className="flex items-center gap-3">
                            <Logo className="w-10 h-10" />
                            <div>
                                <p className="text-white text-lg tracking-tight leading-tight">CEDA Innovation Hub</p>
                                <p className="text-white/45 text-[11px] mt-0.5">Citizen Entrepreneurial Development Agency</p>
                            </div>
                        </div>

                        <h1 className="text-white text-[44px] xl:text-5xl leading-[1.08] tracking-tight mt-12">
                            From idea to <FlipText loop={false} duration={1.8} delay={0.4}>award</FlipText>.
                        </h1>

                        <p className="text-white/65 text-lg mt-5 leading-relaxed max-w-lg">
                            One platform for the whole CEDA innovation pipeline — submit your innovation,
                            follow it through every stage gate, and get structured feedback at each one.
                        </p>

                        {/* the pipeline, colour-coded by stage */}
                        <div className="mt-9 flex flex-wrap items-center gap-2">
                            {['Draft', 'Screening', 'Evaluation', 'Selection', 'Award'].map((label, i, arr) => (
                                <React.Fragment key={label}>
                                    <span className={`px-3 py-1.5 rounded-full text-xs border ${
                                        i === arr.length - 1
                                            ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
                                            : 'border-white/12 bg-white/5 text-white/60'
                                    }`}>
                                        {label}
                                    </span>
                                    {i < arr.length - 1 && <span className="text-white/20 text-xs">→</span>}
                                </React.Fragment>
                            ))}
                        </div>
                    </motion.div>

                    {showcase.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                            className="mt-10"
                        >
                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-3">Recently awarded</p>
                            <DraggableMarquee
                                items={showcase.map(s => ({ id: s.id, src: '', alt: s.title, width: 320, height: 200, title: s.title }))}
                                speed={0.4}
                                repeatCount={2}
                                renderItem={(item) => (
                                    <span className="px-3 py-1.5 rounded-full text-xs bg-white/8 text-white/60 whitespace-nowrap">
                                        {item.title}
                                    </span>
                                )}
                            />
                        </motion.div>
                    )}
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
