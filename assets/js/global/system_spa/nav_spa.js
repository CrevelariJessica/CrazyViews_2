import { 
    contentDiv, 
    navigationState, 
    buildAppUrl, 
    normalizeAppPath, 
    buildRouteUrl 
} from '../system/confg_global.js';

export async function switchPage(url, addHistory = true, syncMenuCallback) {
    if (navigationState.isNavigating || !contentDiv) return;

    if (window.pageCleanup && typeof window.pageCleanup === 'function') {
        try { window.pageCleanup(); } catch (e) { console.error("Erro no cleanup:", e); }
        window.pageCleanup = null;
    }

    navigationState.isNavigating = true;
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

            document.querySelectorAll('.page-script').forEach(s => s.remove());

            // --- GESTÃO DE DEPENDÊNCIAS ---
            
            // 1. Dependências da página Template Update
            if (cleanPath.includes('templateUpdate')) {
                const dependencias = [
                    'assets/js/page_edition.js',
                    'assets/js/editions/ed_render/edt_render.js',
                    'assets/js/global/api/api_t.js'
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

            // 2. Dependências da página de Leitura/Detalhes (read.html)
            // A ordem aqui importa: ajudantes primeiro, ações depois, e o pilar por último.
            if (cleanPath.includes('read')) {
                const dependenciasRead = [
                    'assets/js/titles/tit_render/detail_helpers.js',
                    'assets/js/global/modal/detail_modals.js',
                    'assets/js/editions/ed_render/detail_list_loader.js',
                    'assets/js/editions/ed_button/detail_actions.js',
                    'assets/js/pages/read/read_detail_manager.js' // Arquivo Pilar
                ];
                for (const src of dependenciasRead) {
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
                if (typeof syncMenuCallback === 'function') syncMenuCallback();
                setTimeout(() => {
                    navigationState.isNavigating = false;
                    if (cleanPath.includes('templateUpdate') && typeof window.carregarDadosTitulo === 'function') {
                        window.carregarDadosTitulo();
                    }
                }, 100);
            };
            masterScript.onerror = () => { navigationState.isNavigating = false; };
            document.body.appendChild(masterScript);
            contentDiv.classList.remove('fade-out');

        } catch (error) {
            navigationState.isNavigating = false;
            console.error("Falha na navegação:", error);
            contentDiv.classList.remove('fade-out');
            contentDiv.innerHTML = `<p style="padding:20px; color:red;">Erro ao carregar conteúdo.</p>`;
        }
    }, 400);
}

window.carregarConteudo = (url) => switchPage(url, true);