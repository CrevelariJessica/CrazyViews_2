// Importações dos módulos filhos
import { initDarkMode } from './dark_mode/dark_mode.js';
import { getRouteState, radioInputs, normalizeAppPath, navigationState } from './system/confg_global.js';
import { switchPage } from './system_spa/nav_spa.js';

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

// Configura o comportamento do botão "Voltar" do navegador
window.onpopstate = function() {
    navigationState.isNavigating = false;
    const { page, params } = getRouteState();
    switchPage(`view/${page.replace('.html', '')}.html${params}`, false, syncMenuWithURL);
};

// Configura os cliques nos inputs de navegação (Menu)
radioInputs.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.checked) switchPage(e.target.value, true, syncMenuWithURL);
    });
});

// --- INICIALIZAÇÃO AO CARREGAR O SITE ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa o Dark Mode
    initDarkMode();

    // 2. Carrega a página inicial baseada na URL atual
    const { page, params } = getRouteState();
    switchPage(`view/${page.replace('.html', '')}.html${params}`, false, syncMenuWithURL);
});