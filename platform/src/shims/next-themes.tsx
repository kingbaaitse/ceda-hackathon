/**
 * Minimal next-themes shim backed by our own ThemeContext.
 * The Obsidian UI originals import `useTheme` from "next-themes".
 */
export { useTheme } from '../context/ThemeContext';

export default { useTheme: undefined };
