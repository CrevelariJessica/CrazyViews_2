const PATH_API = window.buildAppUrl ? window.buildAppUrl('php/api_title_list.php') : '../php/api_title_list.php';
const PATH_ACTIONS_API = window.buildAppUrl ? window.buildAppUrl('php/api_actions.php') : '../php/api_actions.php';
window.PATH_ACTIONS_API = PATH_ACTIONS_API; // Mantido para uso em modals.js
window.PATH_API = PATH_API; // Adicionado para uso em modals.js

// Variáveis de Estado Global para Paginação
let currentPage = 1;
const titlesPerPage = 20; // Limite de títulos por carga
let totalTitulosEncontrados = 0; // Armazena o total retornado pelo backend

// A variável 'tituloIdParaDeletar' e as funções 'mostrarModalConfirmacao', 
// 'fecharModalConfirmacao', 'deletarTitulo' foram movidas para modals.js.

// =========================================================
// FUNÇÕES DE CONTROLE DE AÇÕES NO CARD
// =========================================================

function abrirMenuEdicao(iconElement, tituloId) {
    // Esta função foi alterada para chamar o modal de edição em modals.js,
    // garantindo que, se o modal for removido, a URL seja o fallback.
    if (typeof window.abrirModalEdicao === 'function') {
        window.abrirModalEdicao(tituloId);
    } else {
        // Fallback: Redireciona para a página de edição (como estava antes)
        window.location.href = window.buildRouteUrl
            ? window.buildRouteUrl('templateUpdate', { id: tituloId })
            : `principal.html?page=templateUpdate&id=${tituloId}`;
    }
}

// =========================================================
// FUNÇÃO PRINCIPAL DE RENDERIZAÇÃO
// =========================================================

// Função auxiliar para renderizar/anexar cards
function renderizarCards(titulos, containerId, appendResults = false) {
    const containerCards = document.getElementById(containerId);
    if (!containerCards) return;

    if (!appendResults) {
        containerCards.innerHTML = ''; // Limpa TUDO se não for para anexar
    }

    // Caminho para o placeholder (Relativo a /view/pages/)
    const placeholderUrl = window.buildAppUrl ? window.buildAppUrl('assets/img/placeholder.jpg') : '../assets/img/placeholder.jpg'; 

    // PREFIXO PADRONIZADO para funcionar tanto no Docker quanto fora dele.
    const DB_PATH_PREFIX = window.buildAppUrl ? '' : '../'; 
    
    titulos.forEach(titulo => {
        const isFavorito = titulo.is_favorito == 1;
        const favoritoClass = isFavorito ? 'fas' : 'far';
        const corFavorito = isFavorito ? '#F4D35E' : '#FCFCFC';
        
        const cardWrapper = document.createElement('div');
        cardWrapper.classList.add('card_lib');

        // Aplica o prefixo apenas se houver uma URL de capa válida
        const rawCapaUrl = titulo.url_capa;
        const finalCapaUrl = rawCapaUrl
            ? (window.buildAppUrl ? window.buildAppUrl(rawCapaUrl) : DB_PATH_PREFIX + rawCapaUrl)
            : placeholderUrl;
        
        // Estrutura do Card
        // NOTA: As chamadas 'mostrarModalConfirmacao' e 'abrirMenuEdicao' agora dependem
        // de estarem disponíveis globalmente (exportadas de modals.js e carregadas no HTML).
        cardWrapper.innerHTML = `
            <div class="lib_cardActions">
                <div class="lib_bAction">
                    <i class="${favoritoClass} fa-heart lib_iconAction" 
                        style="color: ${corFavorito};" 
                        onclick="toggleFavorito(${titulo.id_titulo}, this)"></i>
                    <i class="fas fa-edit lib_iconAction" onclick="abrirMenuEdicao(this, ${titulo.id_titulo})"></i>
                    <i class="fas fa-trash-alt lib_iconAction" onclick="mostrarModalConfirmacao(${titulo.id_titulo})"></i>
                </div>
            </div>
            <div class="lib_card">
                <div class="lib_cardImag">
                    <!-- Usa o campo 'url_capa' e garante o fallback do placeholder com onerror -->
                    <img src="${finalCapaUrl}" 
                         alt="Capa de ${titulo.titulo}" 
                         class="card_capa_img"
                         onerror="this.onerror=null; this.src='${placeholderUrl}';">
                </div>
                <div class="lib_cardInfo">
                    <a href="${window.buildRouteUrl ? window.buildRouteUrl('templateUpdate', { id: titulo.id_titulo }) : `principal.html?page=templateUpdate&id=${titulo.id_titulo}`}" class="lib_cardT">
                        <h3>${titulo.titulo}</h3>
                    </a>
                    <p class="lib_cardO">${titulo.original}</p>
                    <div class="lib_cardIn">
                        <p class="lib_cardE">Ano: ${titulo.lancamento}</p>
                        <p class="lib_cardE">Edições: ${titulo.edicoes_por_titulo}</p>
                    </div>
                    <p class="lib_cardE">Gênero: ${titulo.genero}</p>
                </div>
            </div>
        `;
        containerCards.appendChild(cardWrapper);
    });
}

/**
 * Função principal para buscar dados da API e renderizar a lista.
 * @param {string} rawQueryParams - Query string crua (ex: "mode=favorites").
 * @param {boolean} appendResults - Se deve anexar os resultados em vez de limpar o container.
 */
async function carregarListaTitulos(rawQueryParams = '', appendResults = false) {
    const containerCards = document.getElementById('lib_List');
    const feedbackMsg = document.getElementById('feedback_message');
    const totalTitulosDisplay = document.getElementById('pageTitleDisplay');
    
    // 1. Controle de Paginação e Limpeza
    if (!appendResults) {
        currentPage = 1; // Reseta para a página 1 em uma nova busca/modo
        if (containerCards) {
            containerCards.innerHTML = ''; // Limpa o container
        }
    }

    let url = `${PATH_API}?${rawQueryParams}`;
    let isFavoritesMode = rawQueryParams.includes('mode=favorites');
    
    if (window.location.pathname.includes('/favorite.html') && !isFavoritesMode) {
        isFavoritesMode = true;
        url = `${PATH_API}?mode=favorites`;
    }
    
    const titleText = isFavoritesMode ? 'Favoritos' : 'Títulos Enviados';

    // 2. Adiciona Paginação se não for o modo favoritos (Paginação só para 'Títulos Enviados')
    if (!isFavoritesMode) {
        // Se a query string está vazia, adiciona 'mode=all' por padrão (Títulos Enviados)
        if (rawQueryParams === '') {
            url += `mode=all`;
        }
        url += `&page=${currentPage}&limit=${titlesPerPage}`;
    }

    // 3. Status de Carregamento
    if (feedbackMsg) {
        feedbackMsg.textContent = appendResults ? 'Carregando mais títulos...' : 'Carregando títulos...';
        feedbackMsg.style.display = 'block';
    }
    
    if (totalTitulosDisplay) {
        totalTitulosDisplay.textContent = `${titleText}: ...`;
    }
    
try {
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    const titulos = data.titulos || [];
    
    totalTitulosEncontrados = data.total_registros || 0; // Pega o total do backend

    // 4. Processamento do Sucesso (Lógica Simplificada para maior robustez na atualização da lista)
    if (data.status === 'sucesso' && Array.isArray(titulos)) {
        
        // 4a. Sempre atualiza a contagem total
        if (totalTitulosDisplay) {
             totalTitulosDisplay.textContent = `${titleText} (${totalTitulosEncontrados} no total)`;
        }
        
        // 4b. Sempre renderiza (anexa ou substitui) os cards
        renderizarCards(titulos, 'lib_List', appendResults);
        
        // 4c. Exibe mensagem de feedback se a lista estiver vazia (e não estiver anexando)
        if (titulos.length === 0 && !appendResults) {
             if (feedbackMsg) {
                 feedbackMsg.style.display = 'block';
                 feedbackMsg.textContent = data.mensagem || `Nenhum título para ser mostrado.`;
             }
        } else if (feedbackMsg) {
            // Se houver resultados, esconde a mensagem de carregamento/vazio
            feedbackMsg.style.display = 'none';
        }
        
        // 5. Atualiza o botão de Paginação
        updatePaginationUI(totalTitulosEncontrados);
    
    } else {
        // Tratamento de Erro da API
        if (feedbackMsg) {
            feedbackMsg.style.display = 'block';
            feedbackMsg.textContent = 'Erro ao carregar lista: ' + (data.mensagem || 'Resposta incompleta da API.');
        }
        if (containerCards) { containerCards.innerHTML = ''; }
        updatePaginationUI(0); // Esconde o botão
        console.error('Erro da API:', data);
    }

} catch(error) {
    // 6. Tratamento de Erro de Conexão/Rede
    if (containerCards) { containerCards.innerHTML = ''; }
    if (feedbackMsg) {
        feedbackMsg.style.display = 'block';
        feedbackMsg.textContent = 'Erro de conexão ou JSON inválido.';
    }
    updatePaginationUI(0); // Esconde o botão
    console.error('Erro de rede/JSON:', error);
}
}
/**
 * Renderiza o botão "Carregar Mais" e a mensagem de total.
 * @param {number} totalResultados - O número total de títulos disponíveis na API.
 */
function updatePaginationUI(totalResultados) {
    const paginationContainer = document.getElementById('pagination-controls');
    if (!paginationContainer) return;

    // Se estiver no modo favoritos, esconde o botão de paginação (Favoritos carrega tudo)
    const isFavoritesMode = window.location.search.includes('mode=favorites') || window.location.pathname.includes('/favorite.html');
    if (isFavoritesMode) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    // Calcula o total de itens já carregados
    const loadedCount = currentPage * titlesPerPage;
    
    // Verifica se ainda há mais títulos para carregar
    const hasMore = loadedCount < totalResultados;
    
    paginationContainer.innerHTML = '';
    
    if (hasMore) {
        // Renderiza o botão "Carregar Mais"
        const loadMoreButton = document.createElement('button');
        loadMoreButton.classList.add('load-more-btn', 'mt-4', 'bg-blue-500', 'hover:bg-blue-700', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded-lg', 'shadow-lg'); // Adicionando algumas classes Tailwind de exemplo
        loadMoreButton.textContent = `Carregar Mais ${titlesPerPage} de ${totalResultados} Títulos`;
        loadMoreButton.onclick = carregarMaisTitulos;
        paginationContainer.appendChild(loadMoreButton);
    }
}
/**
 * Função para carregar mais títulos, incrementando a página.
 */
function carregarMaisTitulos() {
    currentPage++;
    // Chama a lista, instruindo para ADICIONAR os resultados (appendResults = true)
    // Usa o search da URL para manter os filtros ativos, se houver
    carregarListaTitulos(window.location.search.substring(1), true);
}
// ------------------------------------------------------------------------------
// EXPORTAÇÃO E INICIALIZAÇÃO
// As funções de modal foram removidas daqui, e 'abrirMenuEdicao' foi mantida.
window.carregarListaTitulos = carregarListaTitulos;
window.abrirMenuEdicao = abrirMenuEdicao; // Chamará window.abrirModalEdicao (de modals.js)
window.carregarMaisTitulos = carregarMaisTitulos; 
// Mantive a exportação de toggleFavorito se ela estiver definida em outro lugar ou for necessária.
// window.toggleFavorito = toggleFavorito; 

document.addEventListener('DOMContentLoaded', () => {
    
    let mode = '';
    
    // 1. Lógica para a Página de FAVORITOS
    if (window.location.pathname.includes('favorite.html')) {
        mode = 'mode=favorites';
        
    // 2. Lógica para a Página de TÍTULOS ENVIADOS
    } else if (window.location.pathname.includes('titlesUp.html')) {
        mode = 'mode=all'; // O modo padrão da sua lista de envios
    }
    
    // 3. Se um modo for detectado, carrega a lista
    if (mode) {
        // Isso garante que a função é chamada uma única vez
        carregarListaTitulos(mode, false);
    }
});