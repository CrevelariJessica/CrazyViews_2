window.TitleListCtx = window.TitleListCtx || {};

window.TitleListCtx.updatePaginationUI = function(totalResultados) {
    const ctx = window.TitleListCtx; // Alvo explícito em vez de 'this'
    const paginationContainer = document.getElementById('pagination-controls');
    if (!paginationContainer) return;

    const isFavoritesMode = window.location.search.includes('mode=favorites') || window.location.pathname.includes('/favorite.html');
    if (isFavoritesMode) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    const limit = ctx.titlesPerPage || 20;
    const loadedCount = ctx.currentPage * limit;
    const hasMore = loadedCount < totalResultados;
    
    paginationContainer.innerHTML = '';
    
    if (hasMore) {
        const loadMoreButton = document.createElement('button');
        loadMoreButton.classList.add('load-more-btn', 'mt-4', 'bg-blue-500', 'hover:bg-blue-700', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded-lg', 'shadow-lg');
        loadMoreButton.textContent = `Carregar Mais ${limit} de ${totalResultados} Títulos`;
        
        loadMoreButton.onclick = function() {
            if (typeof ctx.carregarMaisTitulos === 'function') ctx.carregarMaisTitulos();
        };
        
        paginationContainer.appendChild(loadMoreButton);
    }
};

window.TitleListCtx.carregarMaisTitulos = function() {
    const ctx = window.TitleListCtx; // Alvo explícito em vez de 'this'
    ctx.currentPage++;
    const query = window.location.search.substring(1);
    ctx.carregarListaTitulos(query, true);
};