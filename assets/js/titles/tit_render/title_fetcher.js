window.TitleListCtx = window.TitleListCtx || {};

window.TitleListCtx.carregarListaTitulos = async function(rawQueryParams = '', appendResults = false) {
    // Alvo explícito para evitar problemas de escopo/this do JavaScript
    const ctx = window.TitleListCtx; 
    
    const containerCards = document.getElementById('lib_List');
    const feedbackMsg = document.getElementById('feedback_message');
    const totalTitulosDisplay = document.getElementById('pageTitleDisplay');
    
    if (!appendResults) {
        ctx.currentPage = 1; 
        if (containerCards) containerCards.innerHTML = ''; 
    }

    // Garante um fallback caso o PATH_API não tenha sido definido no manager ainda
    const apiPath = ctx.PATH_API || (window.buildAppUrl ? window.buildAppUrl('php/api_title_list.php') : '../php/api_title_list.php');
    let url = `${apiPath}?${rawQueryParams}`;
    let isFavoritesMode = rawQueryParams.includes('mode=favorites');
    
    if (window.location.pathname.includes('/favorite.html') && !isFavoritesMode) {
        isFavoritesMode = true;
        url = `${apiPath}?mode=favorites`;
    }
    
    const titleText = isFavoritesMode ? 'Favoritos' : 'Títulos Enviados';

    if (!isFavoritesMode) {
        if (rawQueryParams === '') {
            url += `mode=all`;
        }
        // Usa um fallback (20) caso titlesPerPage esteja indefinido
        const limit = ctx.titlesPerPage || 20;
        url += `&page=${ctx.currentPage}&limit=${limit}`;
    }

    if (feedbackMsg) {
        feedbackMsg.textContent = appendResults ? 'Carregando mais títulos...' : 'Carregando títulos...';
        feedbackMsg.style.display = 'block';
    }
    
    if (totalTitulosDisplay) {
        totalTitulosDisplay.textContent = `${titleText}: ...`;
    }
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

        const data = await response.json();
        const titulos = data.titulos || [];
        
        ctx.totalTitulosEncontrados = data.total_registros || 0;

        if (data.status === 'sucesso' && Array.isArray(titulos)) {
            if (totalTitulosDisplay) {
                totalTitulosDisplay.textContent = `${titleText} (${ctx.totalTitulosEncontrados} no total)`;
            }
            
            if (typeof ctx.renderizarCards === 'function') {
                ctx.renderizarCards(titulos, 'lib_List', appendResults);
            }
            
            if (titulos.length === 0 && !appendResults) {
                if (feedbackMsg) {
                    feedbackMsg.style.display = 'block';
                    feedbackMsg.textContent = data.mensagem || `Nenhum título para ser mostrado.`;
                }
            } else if (feedbackMsg) {
                feedbackMsg.style.display = 'none';
            }
            
            if (typeof ctx.updatePaginationUI === 'function') {
                ctx.updatePaginationUI(ctx.totalTitulosEncontrados);
            }
        
        } else {
            if (feedbackMsg) {
                feedbackMsg.style.display = 'block';
                feedbackMsg.textContent = 'Erro ao carregar lista: ' + (data.mensagem || 'Resposta incompleta da API.');
            }
            if (containerCards) containerCards.innerHTML = '';
            if (typeof ctx.updatePaginationUI === 'function') ctx.updatePaginationUI(0);
            console.error('Erro da API:', data);
        }

    } catch(error) {
        if (containerCards) containerCards.innerHTML = '';
        if (feedbackMsg) {
            feedbackMsg.style.display = 'block';
            feedbackMsg.textContent = 'Erro de conexão ou JSON inválido.';
        }
        if (typeof ctx.updatePaginationUI === 'function') ctx.updatePaginationUI(0);
        console.error('Erro de rede/JSON:', error);
    }
};