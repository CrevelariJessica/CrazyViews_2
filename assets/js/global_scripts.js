// --- CONFIGURAÇÕES GLOBAIS ---
const PROJECT_BASE_PATH = window.location.pathname.includes('/view/') ? '../' : '';
const contentDiv = document.getElementById('content');
const radioInputs = document.querySelectorAll('input[name="plan"]');
let isNavigating = false;

function normalizeAppPath(path = '') {
    return String(path || '').replace(/^(\.\.\/|\.\/|\/)+/, '');
}

function buildAppUrl(path = '') {
    return PROJECT_BASE_PATH + normalizeAppPath(path);
}

function buildRouteUrl(page = 'dashboard', extraParams = {}) {
    const cleanPage = normalizeAppPath(page).replace(/^view\//, '').replace(/\.html$/, '') || 'dashboard';
    const params = new URLSearchParams(extraParams);
    params.set('page', cleanPage);
    const query = params.toString();
    return buildAppUrl(`principal.html${query ? `?${query}` : ''}`);
}

function getRouteState() {
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

window.normalizeAppPath = normalizeAppPath;
window.buildAppUrl = buildAppUrl;
window.buildRouteUrl = buildRouteUrl;
window.openAppPage = (page, params = {}) => {
    window.location.href = buildRouteUrl(page, params);
};

// --- SISTEMA DE DARK MODE---
function applyTheme(isDark) {
    const theme = isDark ? 'dark' : 'light';

    document.body.classList.toggle('dark-mode', isDark);
    document.body.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
}

function initDarkMode() {
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

// --- FUNÇÃO PRINCIPAL DE NAVEGAÇÃO (SPA) ---
async function switchPage(url, addHistory = true) {
    if (isNavigating || !contentDiv) return;

    // Cleanup de eventos da página anterior
    if (window.pageCleanup && typeof window.pageCleanup === 'function') {
        try { window.pageCleanup(); } catch (e) { console.error("Erro no cleanup:", e); }
        window.pageCleanup = null;
    }

    isNavigating = true;
    contentDiv.classList.add('fade-out');

    setTimeout(async () => {
        try {
            const urlObj = new URL(buildAppUrl(url), window.location.href);
            const params = urlObj.search;
            let cleanPath = normalizeAppPath(urlObj.pathname);

            let fetchPath = cleanPath;
            if (!fetchPath.startsWith('view/')) fetchPath = 'view/' + fetchPath;
            if (!fetchPath.endsWith('.html')) fetchPath += '.html';

            const fetchUrl = `${buildAppUrl(fetchPath)}${params}${params ? '&' : '?'}v=${Date.now()}`;

            const response = await fetch(fetchUrl);
            if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);

            const html = await response.text();
            window.scrollTo(0, 0);
            contentDiv.innerHTML = html;

            if (addHistory) {
                const pageName = fetchPath.replace(/^view\//, '').replace('.html', '');
                const historyParams = Object.fromEntries(new URLSearchParams(params).entries());
                history.pushState({ pageUrl: url }, "", buildRouteUrl(pageName, historyParams));
            }

            // Limpa scripts de páginas anteriores
            document.querySelectorAll('.page-script').forEach(s => s.remove());

            // --- GESTÃO DE DEPENDÊNCIAS ---
            if (cleanPath.includes('templateUpdate')) {
                const dependencias = [
                    'assets/js/page_edition.js',
                    'assets/js/edt_render.js',
                    'assets/js/api_t.js'
                ];
                for (const src of dependencias) {
                    await new Promise((resolve) => {
                        const s = document.createElement('script');
                        s.src = buildAppUrl(src) + '?v=' + Date.now();
                        s.className = 'page-script';
                        s.onload = resolve;
                        s.onerror = resolve;
                        document.body.appendChild(s);
                    });
                }
            }

            // --- CARREGAMENTO DO SCRIPT DA PÁGINA ---
            let scriptPath = fetchPath.replace('.html', '.js');
            scriptPath = buildAppUrl(scriptPath);

            const masterScript = document.createElement("script");
            masterScript.src = scriptPath + '?v=' + Date.now();
            masterScript.className = 'page-script';
            masterScript.onload = () => {
                syncMenuWithURL();
                setTimeout(() => {
                    isNavigating = false;
                    // Inicialização específica de cada página
                    if (cleanPath.includes('templateUpdate') && typeof window.carregarDadosTitulo === 'function') {
                        window.carregarDadosTitulo();
                    }
                }, 100);
            };
            masterScript.onerror = () => { isNavigating = false; };
            document.body.appendChild(masterScript);
            contentDiv.classList.remove('fade-out');

        } catch (error) {
            isNavigating = false;
            console.error("Falha na navegação:", error);
            contentDiv.classList.remove('fade-out');
            contentDiv.innerHTML = `<p style="padding:20px; color:red;">Erro ao carregar conteúdo.</p>`;
        }
    }, 400);
}

window.carregarConteudo = (url) => switchPage(url, true);

// --- SINCRONIZAÇÃO E EVENTOS ---
function syncMenuWithURL() {
    const { page } = getRouteState();
    const targetRadio = Array.from(radioInputs).find(radio => {
        const val = normalizeAppPath(radio.value).toLowerCase();
        return val.includes(page.toLowerCase().replace('.html', ''));
    });

    radioInputs.forEach(r => r.checked = false);
    if (targetRadio) targetRadio.checked = true;
}

window.onpopstate = function() {
    isNavigating = false;
    const { page, params } = getRouteState();
    switchPage(`view/${page.replace('.html', '')}.html${params}`, false);
};

radioInputs.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.checked) switchPage(e.target.value);
    });
});

// --- INICIALIZAÇÃO AO CARREGAR O SITE ---
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();

    const { page, params } = getRouteState();
    switchPage(`view/${page.replace('.html', '')}.html${params}`, false);
});