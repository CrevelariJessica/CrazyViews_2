// --- CONFIGURAÇÕES GLOBAIS ---
const PROJECT_BASE_PATH = '/hq_app';
const contentDiv = document.getElementById('content');
const radioInputs = document.querySelectorAll('input[name="plan"]');
let isNavigating = false;

// --- SISTEMA DE DARK MODE---
function initDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const currentMode = localStorage.getItem('darkMode');

    // Aplica o modo salvo ao carregar a página
    if (currentMode === 'enabled') {
        document.body.classList.add('dark-mode');
        if (darkModeToggle) darkModeToggle.checked = true;
    }

    // Ouvinte para o novo botão Toggle
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', () => {
            if (darkModeToggle.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('darkMode', 'enabled');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('darkMode', 'disabled');
            }
        });
    }
}

// --- FUNÇÃO PRINCIPAL DE NAVEGAÇÃO (SPA) ---
async function switchPage(url, addHistory = true) {
    if (isNavigating) return;
    
    // Cleanup de eventos da página anterior
    if (window.pageCleanup && typeof window.pageCleanup === 'function') {
        try { window.pageCleanup(); } catch (e) { console.error("Erro no cleanup:", e); }
        window.pageCleanup = null;
    }
    
    isNavigating = true;
    contentDiv.classList.add('fade-out');

    setTimeout(async () => {
        try {
            const urlObj = new URL(url, window.location.origin);
            const params = urlObj.search;
            let cleanPath = urlObj.pathname.replace(/^\/+/, '');

            let fetchPath = cleanPath;
            if (!fetchPath.startsWith('view/')) fetchPath = 'view/' + fetchPath;
            if (!fetchPath.endsWith('.html')) fetchPath += '.html';
                
            const fetchUrl = '/' + 'hq_app/' + fetchPath + params + (params ? '&' : '?') + 'v=' + Date.now();
            
            const response = await fetch(fetchUrl);
            if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
            
            const html = await response.text();
            window.scrollTo(0, 0);
            contentDiv.innerHTML = html;

            if (addHistory) {
                const visualURL = cleanPath.replace('view/', '').replace('.html', '') + params;
                history.pushState({ pageUrl: url }, "", visualURL);
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
                        s.src = src + '?v=' + Date.now();
                        s.className = 'page-script';
                        s.onload = resolve;
                        s.onerror = resolve;
                        document.body.appendChild(s);
                    });
                }
            }

            // --- CARREGAMENTO DO SCRIPT DA PÁGINA ---
            let scriptPath = fetchPath.replace('.html', '.js');
            if (!scriptPath.startsWith('/')) scriptPath = '/hq_app/' + scriptPath;

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
    const path = window.location.pathname.split('/').filter(Boolean).pop() || 'dashboard';
    const targetRadio = Array.from(radioInputs).find(radio => {
        const val = radio.value.toLowerCase();
        return val.includes(path.toLowerCase().replace('.html', ''));
    });
    
    radioInputs.forEach(r => r.checked = false); // Reseta todos
    if (targetRadio) targetRadio.checked = true;
}

window.onpopstate = function() {
    isNavigating = false;
    const path = window.location.pathname.split('/').pop() || 'dashboard';
    const params = window.location.search;
    switchPage(`view/${path.replace('.html', '')}.html${params}`, false);
};

radioInputs.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.checked) switchPage(e.target.value);
    });
});

// --- INICIALIZAÇÃO AO CARREGAR O SITE ---
document.addEventListener('DOMContentLoaded', () => {
    // Inicia o Dark Mode
    initDarkMode();

    // Determina a página inicial
    let path = window.location.pathname.split('/').filter(Boolean).pop() || 'dashboard';
    let params = window.location.search;
    if (['principal.html', 'index.html', 'hq_app'].includes(path)) path = 'dashboard';

    switchPage(`view/${path.replace('.html', '')}.html${params}`, false);
});