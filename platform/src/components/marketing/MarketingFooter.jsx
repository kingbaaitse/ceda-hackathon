/**
 * MarketingFooter — the legal footer shared by every public page.
 *
 * Deliberately not a link farm: it states what the platform is, who built
 * it, and the legal position (privacy, terms, data protection, the Data
 * Protection Act commitment) without pretending to be a sitemap.
 */
import React from 'react';
import Logo from '../Logo';

const LEGAL = [
    { label: 'Privacy policy', href: '/login' },
    { label: 'Terms of use', href: '/login' },
    { label: 'Data protection', href: '/login' },
    { label: 'Accessibility', href: '/login' },
];

export default function MarketingFooter({ children }) {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-gray-200 dark:border-white/5">
            <div className="max-w-6xl mx-auto px-6 pt-14 pb-10">
                {children}

                <div className="flex flex-wrap items-center justify-between gap-6 pt-8 mt-8 border-t border-gray-200 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <Logo className="w-8 h-8" />
                        <div>
                            <p className="text-sm font-medium">CEDA Innovation Hub</p>
                            <p className="text-[11px] text-gray-500 dark:text-white/40">
                                Citizen Entrepreneurial Development Agency · Botswana
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
                            {LEGAL.map(item => (
                                <li key={item.label}>
                                    <a
                                        href={item.href}
                                        className="text-xs text-gray-500 dark:text-white/45 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    >
                                        {item.label}
                                    </a>
                                </li>
                            ))}
                        </ul>

                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-white/45">
                            <span>Designed and developed by</span>
                            <img
                                src="/partners/oratory-league-logo.png"
                                alt="Oratory League"
                                className="h-8 w-auto max-w-[130px] object-contain object-left dark:brightness-125"
                            />
                        </div>
                    </div>
                </div>

                <p className="mt-6 text-[11px] leading-relaxed text-gray-400 dark:text-white/35 max-w-4xl">
                    © {year} Citizen Entrepreneurial Development Agency. All rights reserved.
                    Submissions, evaluations and personal data are processed in line with Botswana's
                    Data Protection Act and retained only for as long as the competition and any
                    appeal require. Access to a submission is limited to its owner, CEDA
                    administrators and the judges assigned to it; every access is recorded in the
                    audit trail.
                </p>
            </div>
        </footer>
    );
}
