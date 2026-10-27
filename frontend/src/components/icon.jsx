// Small SVGs matching the first Home / Search screen and prototype.
const paths = {
    close: <path d="m6 6 12 12M6 18 18 6"/>,
    filter: <><path d="M4 3v7m0 4v7M12 3v5m0 4v9M20 3v9m0 4v5M1 14h6M9 8h6M17 16h6"/></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3ZM9 3v15M15 6v15"/></>,
    brand: <><path d="M1 10 12 1l11 9h-3v12h-6v-8h-4v8H4V10Z" fill="currentColor" stroke="none"/><path d="m3 10 9-7 9 7" stroke="#8c7bff" strokeWidth="1.1"/><path d="M8 22V11a4 4 0 0 1 8 0v11" stroke="white" strokeWidth=".8"/><circle cx="12" cy="11" r="1.5" stroke="white" strokeWidth=".9"/></>,
    homeFilled: <path d="m2 10 10-8 10 8h-3v11h-5v-7h-4v7H5V10Z" fill="currentColor" stroke="none"/>,
    location: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/></>,
    chevronDown: <path d="m7 10 5 5 5-5"/>,
    room: <><rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M20 9h-7v6h7M14 12h1M7 4V2h10"/></>,
    home: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    search: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></>,
    heart: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>,
    messages: <><path d="M4 4h16v13H9l-5 4Z"/><circle cx="8" cy="10" r=".6" fill="currentColor"/><circle cx="12" cy="10" r=".6" fill="currentColor"/><circle cx="16" cy="10" r=".6" fill="currentColor"/></>,
    star: <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z"/>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    bell: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
    apartment: <><path d="M5 21V3h10v18M15 9h4v12H5M9 7h2M9 11h2M9 15h2M9 21v-3h2v3M17 13h2M17 17h2"/></>,
    condo: <><path d="M3 21V8h6V3h6v5h6v13ZM9 8v13M15 8v13M6 11v2M6 16v2M12 6v2M12 11v2M12 16v2M18 11v2M18 16v2"/></>,
    bed: <><path d="M3 7v11M3 11h18v7M3 16h18M7 11V9a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2"/></>,
    bath: <><path d="M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2"/></>,
    area: <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>,
};
export function Icon({ name, size = 22, className = "", }) {
    return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`shrink-0 ${className}`}>
      {paths[name]}
    </svg>);
}
