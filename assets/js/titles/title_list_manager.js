// Cria o Namespace Global se ele ainda não existir
window.TitleListCtx = window.TitleListCtx || {
    // Estado Global da Paginação
    currentPage: 1,
    titlesPerPage: 20,
    totalTitulosEncontrados: 0,
    
    // Caminhos de Endpoints da API
    PATH_API: window.buildAppUrl ? window.buildAppUrl('php/api_title_list.php') : '../php/api_title_list.php',
    PATH_ACTIONS_API: window.buildAppUrl ? window.buildAppUrl('php/api_actions.php') : '../php/api_actions.php'
};

// Mantido para compatibilidade retroativa com códigos externos/modals.js
window.PATH_API = window.TitleListCtx.PATH_API;
window.PATH_ACTIONS_API = window.TitleListCtx.PATH_ACTIONS_API;

// Exportações Globais diretas no Objeto Window (Legado)
window.carregarListaTitulos = function(rawQueryParams = '', appendResults = false) {
    if (typeof window.TitleListCtx.carregarListaTitulos === 'function') {
        window.TitleListCtx.carregarListaTitulos(rawQueryParams, appendResults);
    }
};

window.carregarMaisTitulos = function() {
    if (typeof window.TitleListCtx.carregarMaisTitulos === 'function') {
        window.TitleListCtx.carregarMaisTitulos();
    }
};

window.abrirMenuEdicao = function(iconElement, tituloId) {
    if (typeof window.abrirModalEdicao === 'function') {
        window.abrirModalEdicao(tituloId);
    } else {
        // Fallback clássico caso o arquivo de modais falhe
        window.location.href = window.buildRouteUrl
            ? window.buildRouteUrl('templateUpdate', { id: tituloId })
            : `principal.html?page=templateUpdate&id=${tituloId}`;
    }
};

// Inicialização do Ciclo de Vida da Página
document.addEventListener('DOMContentLoaded', () => {
    let mode = '';
    const ctx = window.TitleListCtx;
    
    // 1. Lógica para a Página de FAVORITOS
    if (window.location.pathname.includes('favorite.html')) {
        mode = 'mode=favorites';
        
    // 2. Lógica para a Página de TÍTULOS ENVIADOS
    } else if (window.location.pathname.includes('titlesUp.html')) {
        mode = 'mode=all';
    }
    
    // 3. Dispara a busca inicial
    if (mode && typeof ctx.carregarListaTitulos === 'function') {
        ctx.carregarListaTitulos(mode, false);
    }
});