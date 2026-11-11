/** Device details parsed from a Supabase session user agent. */
export function parseUserAgent(ua = '') {
    const s = String(ua);
    const isMobile = /Mobile|Android|iPhone|iPod/i.test(s);
    const isTablet = /iPad|Tablet|Android(?!.*Mobile)/i.test(s);
    const os = /Windows NT/i.test(s) ? 'Windows'
        : /Mac OS X|Macintosh/i.test(s) ? 'macOS'
        : /Android/i.test(s) ? 'Android'
        : /iPhone|iPad|iOS/i.test(s) ? 'iOS'
        : /Linux/i.test(s) ? 'Linux'
        : 'Unknown OS';
    const browser = /Edg\//i.test(s) ? 'Edge'
        : /OPR\//i.test(s) ? 'Opera'
        : /Firefox\//i.test(s) ? 'Firefox'
        : /Chrome\//i.test(s) ? 'Chrome'
        : /Safari\//i.test(s) ? 'Safari'
        : 'Browser';
    const device = isTablet ? 'tablet' : isMobile ? 'phone' : /Mac|Win/i.test(s) ? 'laptop' : 'desktop';
    return { device, browser, os };
}
