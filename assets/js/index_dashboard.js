{const searchState = {
    caminhoApi: 'php/api_title_list.php',
    paginaAtual: 1,
    limitePorPagina: 10,
    totalResultados: 0,
    filtrosAtuais: {}
};
function mostrarLoader(elementoId, mostrar) {
    const el = document.getElementById(elementoId);
    if (!el) return;

    if (mostrar) {
        el.innerHTML = '<span class="loading-spinner"></span> Carregando...';
    } else {
        el.innerHTML = '';
    }
}
async function carregarContadoresGerais() {
    const totalTitulosElement = document.getElementById('totalTitulosGeral');
    const totalFavoritosElement = document.getElementById('totalFavoritosGeral');
    const totalEdicoesElement = document.getElementById('totalEdicoesGeral');
    
    if (totalTitulosElement) totalTitulosElement.textContent = '...';
    if (totalFavoritosElement) totalFavoritosElement.textContent = '...';
    if (totalEdicoesElement) totalEdicoesElement.textContent = '...';

    try {
        const urlContadores = `${searchState.caminhoApi}?mode=general_counts`;
        const response = await fetch(urlContadores);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.status === 'sucesso') {
            const totalTitulosGeral = data.total_geral_cadastrados || 0;
            const totalFavoritos = data.total_favoritos_usuario || 0; 
            const totalEdicoes = data.total_edicoes || 0;
            
            if (totalTitulosElement) {
                totalTitulosElement.textContent = totalTitulosGeral;
            }
            
            if (totalFavoritosElement) {
                totalFavoritosElement.textContent = totalFavoritos;
            }
            
            if (totalEdicoesElement) {
                totalEdicoesElement.textContent = totalEdicoes;
            }
            
        } else {
            console.error('JS: Erro da API ao carregar totais:', data.mensagem);
            if (totalTitulosElement) totalTitulosElement.textContent = '0';
            if (totalFavoritosElement) totalFavoritosElement.textContent = '0';
            if (totalEdicoesElement) totalEdicoesElement.textContent = '0';
        }

    } catch(error) {
        console.error('JS: Falha na comunicação ao carregar contadores:', error);
        if (totalTitulosElement) totalTitulosElement.textContent = '0';
        if (totalFavoritosElement) totalFavoritosElement.textContent = '0';
        if (totalEdicoesElement) totalEdicoesElement.textContent = '0';
    }
}
function coletarFiltros() {
    const filtros = {};
    
    const titulo = document.getElementById('filter_titulo')?.value.trim();
    if (titulo) filtros.titulo = titulo;
    
    const tituloOriginal = document.getElementById('filter_titulo_original')?.value.trim();
    if (tituloOriginal) filtros.titulo_original = tituloOriginal;
    
    const editora = document.getElementById('filter_editora')?.value.trim();
    if (editora) filtros.editora = editora;
    
    const genero = document.getElementById('filter_genero')?.value.trim();
    if (genero) filtros.genero = genero;

    const dataLancamento = document.getElementById('filter_data_lancamento')?.value.trim();
    if (dataLancamento) filtros.data_lancamento = dataLancamento;
    
    const paginas = document.getElementById('filter_paginas')?.value;
    if (paginas && paginas !== 'todos') {
        if (paginas === '100+') {
            filtros.paginas_min = 100;
        } else {
            const range = paginas.split('-');
            if (range.length === 2) {
                filtros.paginas_min = parseInt(range[0], 10);
                filtros.paginas_max = parseInt(range[1], 10);
            }
        }
    }

    const favorito = document.getElementById('filter_favorito')?.checked;
    if (favorito) filtros.mode = 'favorites';
    const possuiEdicoes = document.getElementById('filter_possui_edicoes')?.value;
    if (possuiEdicoes && possuiEdicoes !== 'todos') {
        filtros.has_editions = (possuiEdicoes === 'sim' ? 'yes' : 'no');
    }
    return filtros;
}
async function aplicarFiltros(pagina = 1) {
    let filtros = coletarFiltros();
    
    if (pagina > 1) {
        filtros = searchState.filtrosAtuais;
    } else {
        searchState.filtrosAtuais = filtros;
    }
    
    searchState.paginaAtual = pagina;
    
    const resultadosElement = document.getElementById('resultados-pesquisa');
    const paginacaoElement = document.getElementById('paginacao-controles');
    
    mostrarLoader('loader-pesquisa', true);
    resultadosElement.innerHTML = '';
    paginacaoElement.innerHTML = '';

    const params = new URLSearchParams();
    const finalMode = searchState.filtrosAtuais.mode || 'search';
    params.append('mode', finalMode);
    params.append('limit', searchState.limitePorPagina);
    params.append('offset', (pagina - 1) * searchState.limitePorPagina);

    for (const key in searchState.filtrosAtuais) {
        if (key === 'mode') continue;

        let value = searchState.filtrosAtuais[key];
        
        if (typeof value === 'boolean') {
            value = value ? 'true' : 'false';
        }
        
        if (value) { 
            params.append(key, value);
        }
    }

    const urlBusca = `${searchState.caminhoApi}?${params.toString()}`;
    try {
        const response = await fetch(urlBusca);

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        mostrarLoader('loader-pesquisa', false);

        if (data.status === 'sucesso' && Array.isArray(data.titulos)) {
            searchState.totalResultados = data.total_registros || data.total_encontrados || 0; 
            const listaTitulos = data.titulos;
            if (listaTitulos.length === 0) {
                 resultadosElement.innerHTML = '<p style="text-align: center; color: #555;">Nenhum título encontrado com os filtros aplicados.</p>';
            } else {
                 renderizarTitulos(listaTitulos, resultadosElement);
            }
            renderizarPaginacao(paginacaoElement);
        } else {
            resultadosElement.innerHTML = `<p style="text-align: center; color: red;">${data.mensagem || 'Erro desconhecido na resposta da API. Verifique os logs de debug para o status.'}</p>`;
            searchState.totalResultados = 0;
            console.error('JS: Status da API não é sucesso ou campo titulos está faltando. Resposta:', data);
        }

    } catch(error) {
        mostrarLoader('loader-pesquisa', false);
        console.error('JS: Falha grave na busca (Erro de Fetch ou HTTP):', error.message, error);
        resultadosElement.innerHTML = '<p style="text-align: center; color: red;">Erro ao comunicar com o servidor de busca. Verifique o console para detalhes.</p>';
        searchState.totalResultados = 0;
    }
}
function renderizarTitulos(titulos, container) {
    if (titulos.length === 0) {
        container.innerHTML = '<p style="text-align: center;">Nenhum título encontrado.</p>';
        return;
    }

    let htmlContent = `<div class="container_cards_index">`;

    titulos.forEach(title => {
        const tituloDisplay = title.titulo || 'Título Desconhecido';
        const idTitulo = title.id_titulo; 
        const detalhesLink = `view/templateUpdate.html?id=${idTitulo}`;
        const favoritoIcon = title.is_favorito == 1 ? 
            '<span style="color: gold; margin-left: 5px;" title="Favorito">★</span>' : 
            '';
        const capaUrl = title.url_capa || '';
        const placeholderUrl = 'assets/img/placeholder.jpg';
        const imageTag = `<img 
            src="${capaUrl || placeholderUrl}" 
            alt="Capa do Título: ${tituloDisplay}" 
            class="card-capa-img"
            onerror="this.onerror=null; this.src='${placeholderUrl}';"
        />`;
        htmlContent += `
            <a href="${detalhesLink}" class="card_search">
                <div class="cardImageIndex">
                    ${imageTag} 
                </div>
                <div class="cardTextIndex">
                    <h3 class="cardTitleIndex">
                        ${tituloDisplay} ${favoritoIcon}
                    </h3>
                    <p class="cardOriginalIndex">${title.original || 'N/A'}</p>
                    <p class="cardInfoIndex">Ano: ${title.lancamento || 'N/A'}</p>
                    <p class="cardInfoIndex">Editora: ${title.editora || 'N/A'}</p>
                    <p class="cardInfoIndex">Gênero: ${title.genero || 'N/A'}</p>
                    <p class="cardInfoIndex">Edições: ${title.edicoes_por_titulo || '0'}</p>
                </div>
            </a>
        `;
    });

    htmlContent += `</div>`;
    container.innerHTML = htmlContent;
}
function renderizarPaginacao(container) {
    const totalPaginas = Math.ceil(searchState.totalResultados / searchState.limitePorPagina);
    const paginaAtual = searchState.paginaAtual;

    if (totalPaginas <= 1 && searchState.totalResultados <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = `
        <div class="pagination-container">
            <p>Resultados: ${searchState.totalResultados} | Página ${paginaAtual} de ${totalPaginas}</p>
            <div class="pagination-controls">
                <button onclick="aplicarFiltros(${paginaAtual - 1})" ${paginaAtual === 1 ? 'disabled' : ''}>
                    &lt; Anterior
                </button>
    `;
    const maxPagesToShow = 5;
    let startPage = Math.max(1, paginaAtual - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPaginas, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const activeStyle = i === paginaAtual ? 'background-color: #ddd;' : '';
        html += `
            <button onclick="aplicarFiltros(${i})"
                    style="${activeStyle}">
                ${i}
            </button>
        `;
    }

    html += `
                <button onclick="aplicarFiltros(${paginaAtual + 1})" ${paginaAtual === totalPaginas ? 'disabled' : ''}>
                    Próximo &gt;
                </button>
            </div>
        </div>
    `;

    container.innerHTML = html;
}
// Dentro do seu arquivo assets/js/index_dashboard.js

function iniciarFiltros() {
    console.log("Anexando eventos de filtro ao Dashboard...");
    
    // 1. Carrega os números do topo
    carregarContadoresGerais();
    
    // 2. Busca o formulário no HTML recém-injetado
    const form = document.getElementById('form-filtros');
    
    if (form) {
        // Remove ouvintes antigos para não duplicar, caso o script rode duas vezes
        form.removeEventListener('submit', lidarSubmit);
        form.addEventListener('submit', lidarSubmit);
        console.log("Sucesso: Evento de submit vinculado.");
    } else {
        console.warn("Aviso: Elemento 'form-filtros' não encontrado no DOM.");
    }
}

// Função auxiliar para o listener
function lidarSubmit(e) {
    e.preventDefault();
    aplicarFiltros(1);
}

// EXPORTAÇÃO PARA O MESTRE
// Removemos o DOMContentLoaded daqui porque quem manda agora é o dashboard.js (view)
window.iniciarFiltros = iniciarFiltros; 
window.carregarContadoresGerais = carregarContadoresGerais;
window.aplicarFiltros = aplicarFiltros;

// Executa imediatamente se o script for carregado com o formulário já presente
if (document.getElementById('form-filtros')) {
    iniciarFiltros();
}
}