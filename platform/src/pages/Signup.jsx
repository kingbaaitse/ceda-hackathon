import React, { useState } from 'react';
import PasswordField from '../components/ui/PasswordField';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { ButtonLoader, InlineLoader } from '../components/Loader';
import PhoneInput, { COUNTRIES, flagOf } from '../components/ui/PhoneInput';
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Mail, User, Users } from '../components/AnimatedIcons';

const dialOf = (code) => (COUNTRIES.find(c => c.code === code) || COUNTRIES[0]).dial;

const Signup = ({ onLogin, onLanding }) => {
    const { signup } = useAuth();

    const [entryType, setEntryType] = useState('individual');
    const [fullName, setFullName] = useState('');
    const [orgName, setOrgName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [phoneCountry, setPhoneCountry] = useState('BW');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [confirmSent, setConfirmSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const data = await signup(email, password, {
                full_name: fullName,
                org_name: entryType === 'team' ? orgName : null,
                entry_type: entryType,
                requested_role: 'participant',
                phone: phone ? `${dialOf(phoneCountry)} ${phone}`.trim() : null,
            });
            if (!data.session) setConfirmSent(true);
        } catch (err) {
            setError(err.message || 'Could not create your account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (confirmSent) {
        return (
            <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
                <div className="flex-1 flex items-center justify-center p-8">
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-md text-center">
                        <CheckCircle2 className="w-12 h-12 text-accent-500 mx-auto" />
                        <h2 className="text-gray-900 dark:text-white text-2xl mt-4">Confirm your email</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">
                            We sent a confirmation link to <b>{email}</b>. Confirm to activate your portal account.
                        </p>
                        <button onClick={onLogin} className="btn-secondary mt-6">← Back to sign in</button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row min-h-screen transition-colors duration-300">
            {/* Left: Brand Cover Panel */}
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
                        Register as an individual or a team, then submit your innovation for screening,
                        evaluation and award — with feedback at every stage.
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
                    <button
                        type="button"
                        onClick={onLanding}
                        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:text-white/45 dark:hover:text-white transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to the hub
                    </button>

                    <div className="flex items-center gap-3 mb-8 lg:hidden">
                        <Logo className="w-8 h-8" />
                        <span className="text-gray-900 dark:text-white text-lg">CEDA Innovation Hub</span>
                    </div>

                    <h2 className="text-gray-900 dark:text-white text-3xl tracking-tight">Create your account</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Join as an individual or a team.</p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                        {/* Entry type */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { id: 'individual', label: 'Individual', icon: User },
                                { id: 'team', label: 'Team', icon: Users },
                            ].map(t => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setEntryType(t.id)}
                                    className={`flex items-center justify-center gap-2 rounded-full py-3 text-sm border transition-colors ${entryType === t.id
                                        ? 'border-accent-500 bg-accent-50 text-accent-600 dark:bg-accent-500/10 dark:text-accent-400'
                                        : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                                        }`}
                                >
                                    <t.icon className="w-4 h-4" />
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        <div className="relative">
                            <User className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 z-10" />
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Full name"
                                className="w-full rounded-full field-fill py-3.5 pl-11 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 mb-1.5 block">Phone number</label>
                            <PhoneInput
                                value={phone}
                                onChange={setPhone}
                                country={phoneCountry}
                                onCountryChange={setPhoneCountry}
                            />
                            <p className="text-xs text-gray-400 px-4 mt-1.5">
                                Used only if CEDA needs to reach you about your entry.
                            </p>
                        </div>

                        {entryType === 'team' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                <div className="relative">
                                    <Building2 className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 z-10" />
                                    <input
                                        type="text"
                                        required
                                        value={orgName}
                                        onChange={(e) => setOrgName(e.target.value)}
                                        placeholder="Company / organisation name"
                                        className="w-full rounded-full field-fill py-3.5 pl-11 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 px-4 mt-1.5">
                                    Company entries require 50%+ citizen shareholding (verified at compliance gate).
                                </p>
                            </motion.div>
                        )}

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
                        <PasswordField
                            id="signup-password"
                            value={password}
                            onChange={setPassword}
                            label="Password"
                            placeholder="Create a strong password"
                        />

                        {error && (
                            <p className="text-royal-600 dark:text-royal-400 text-sm px-2">{error}</p>
                        )}

                        <button type="submit" disabled={loading} className="btn-accent w-full disabled:opacity-60">
                            {loading ? <ButtonLoader /> : <ArrowRight className="w-4 h-4" />}
                            Create Account
                        </button>

                        <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-2">
                            Already have an account?{' '}
                            <button type="button" onClick={onLogin} className="text-accent-600 dark:text-accent-400 hover:underline">
                                Sign in
                            </button>
                        </p>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default Signup;
