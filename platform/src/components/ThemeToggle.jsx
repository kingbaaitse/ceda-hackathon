import React, { useState, useRef, useEffect } from 'react';
import {
    Sun,
    Moon,
    Monitor,
    Check,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const ThemeToggle = ({ className = "" }) => {
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const themes = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'auto', label: 'System', icon: Monitor },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentTheme = themes.find(t => t.id === theme) || themes[2];
  const Icon = currentTheme.icon;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        title="Change theme"
      >
        <Icon className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-40 bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden z-[100]"
          >
            <div className="p-1">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    toggleTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${theme === t.id
                    ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <t.icon className={`w-4 h-4 ${theme === t.id ? 'text-accent-500' : ''}`} />
                    {t.label}
                  </div>
                  {theme === t.id && <Check className="w-4 h-4 text-accent-500" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeToggle;
