// --- CONFIGURAÇÕES GLOBAIS ---
export const PROJECT_BASE_PATH = window.location.pathname.includes('/view/') ? '../' : '';
export const contentDiv = document.getElementById('content');
export const radioInputs = document.querySelectorAll('input[name="plan"]');

// Deixamos o estado mutável exportável
export let navigationState = { isNavigating: false }; 

export function normalizeAppPath(path = '') {
    return String(path || '').replace(/^(\.\.\/|\.\/|\/)+/, '');
}

export function buildAppUrl(path = '') {
    return PROJECT_BASE_PATH + normalizeAppPath(path);
}

export function buildRouteUrl(page = 'dashboard', extraParams = {}) {
    const cleanPage = normalizeAppPath(page).replace(/^view\//, '').replace(/\.html$/, '') || 'dashboard';
    const params = new URLSearchParams(extraParams);
    params.set('page', cleanPage);
    const query = params.toString();
    return buildAppUrl(`principal.html${query ? `?${query}` : ''}`);
}

export function getRouteState() {
    const searchParams = new URLSearchParams(window.location.search);
    const pageFromQuery = searchParams.get('page');

    if (pageFromQuery) {
        searchParams.delete('page');
        const queryString = searchParams.toString();
        return {
            page: pageFromQuery.replace('.html', '') || 'dashboard',
            params: queryString ? `?${queryString}` : ''
        };
    }

    let path = window.location.pathname.split('/').filter(Boolean).pop() || 'dashboard';
    if (['principal.html', 'index.html', 'hq_app'].includes(path)) path = 'dashboard';

    return {
        page: path.replace('.html', '') || 'dashboard',
        params: window.location.search
    };
}

// Injeta no escopo global para manter compatibilidade com scripts antigos das páginas
window.normalizeAppPath = normalizeAppPath;
window.buildAppUrl = buildAppUrl;
window.buildRouteUrl = buildRouteUrl;
window.openAppPage = (page, params = {}) => {
    window.location.href = buildRouteUrl(page, params);
};