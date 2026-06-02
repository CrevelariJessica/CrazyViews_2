// --- SISTEMA DE DARK MODE---
function applyTheme(isDark) {
    const theme = isDark ? 'dark' : 'light';
    document.body.classList.toggle('dark-mode', isDark);
    document.body.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
}

export function initDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const storedMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = storedMode ? storedMode === 'enabled' : prefersDark;

    applyTheme(isDark);

    if (darkModeToggle) {
        darkModeToggle.checked = isDark;
        darkModeToggle.setAttribute('aria-checked', String(isDark));

        darkModeToggle.addEventListener('change', () => {
            const enabled = darkModeToggle.checked;
            applyTheme(enabled);
            darkModeToggle.setAttribute('aria-checked', String(enabled));
            localStorage.setItem('darkMode', enabled ? 'enabled' : 'disabled');
        });
    }
}