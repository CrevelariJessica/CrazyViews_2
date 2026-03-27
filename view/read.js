const readerState = {
    edicaoId: null,
    // paginasArray agora armazena URLs COMPLETAS (já com ../ e ?v=cache)
    paginasArray: [], 
    indiceAtual: 0,
    totalPaginas: 0,
    modoAtual: 'pages',
    zoomLevel: 100,
    isDragging: false,
    dragMoved: false,
    lastX: 0,
    lastY: 0
};

// -----------------------------------------------------------------------------
// FUNÇÃO PRINCIPAL: Carrega os dados da Edição e inicializa
async function iniciarLeitor() {
    // Obtém o ID da EDIÇÃO da URL
    const urlParams = new URLSearchParams(window.location.search);
    const idEdicao = urlParams.get('id');

    if (!idEdicao) {
        document.getElementById('page-counter').textContent = 'Erro: ID da Edição não fornecido.';
        return;
    }
    
    readerState.edicaoId = idEdicao;

    const urlApi = `../php/api_read.php?id=${idEdicao}`;

    try {
        const response = await fetch(urlApi);
        const data = await response.json();

        if (data.status === 'sucesso' && data.edicao_data) {
            const edicaoData = data.edicao_data;

            // CORREÇÃO: Usa o novo campo com Cache Buster do PHP (já é um ARRAY)
            const paginas = edicaoData.caminho_paginas_cb || []; 

            if (paginas.length > 0) {
                // Salva o estado
                readerState.paginasArray = paginas;
                // Usa o tamanho do array para definir o total de páginas
                readerState.totalPaginas = paginas.length;
                
                // Atualiza o título da página
                document.title = `Leitor de HQ - Edição #${edicaoData.edicao}`;

                // Renderiza a primeira página (índice 0)
                renderizarPagina(readerState.indiceAtual);
                
                // Inicializa o modo correto
                alternarModoLeitura('pages');

            } else {
                document.getElementById('page-counter').textContent = 'Edição encontrada, mas sem páginas.';
            }

        } else {
            document.getElementById('page-counter').textContent = `Erro: ${data.mensagem || 'Falha ao carregar dados.'}`;
        }
    } catch (error) {
        console.error('Erro ao iniciar o leitor:', error);
        document.getElementById('page-counter').textContent = 'Erro de rede ou servidor.';
    }
}
// -----------------------------------------------------------------------------
// FUNÇÃO DE RENDERIZAÇÃO E NAVEGAÇÃO (Modo Páginas)
function renderizarPagina(indice) {
    if (indice < 0 || indice >= readerState.totalPaginas) {
        console.warn(`Tentativa de navegar para o índice ${indice} que está fora dos limites.`);
        return;
    }
    resetarZoom();//resetar o zoom ao abrir nova página para evitar bugs de resolução
    const imagemElement = document.getElementById('page-image');
    
    // CORREÇÃO: Usa o caminho COMPLETO e pronto que está no paginasArray
    const caminhoCompleto = readerState.paginasArray[indice]; 

    imagemElement.src = caminhoCompleto;
    readerState.indiceAtual = indice;
    
    // Atualiza o contador de páginas (índice + 1)
    document.getElementById('page-counter').textContent = 
        `Página ${indice + 1} de ${readerState.totalPaginas}`;
    
    // Atualiza o estado dos botões
    document.getElementById('prev-btn').disabled = (indice === 0);
    document.getElementById('next-btn').disabled = (indice === readerState.totalPaginas - 1);
}

// -----------------------------------------------------------------------------
// FUNÇÃO DE RENDERIZAÇÃO ESPECÍFICA PARA O MODO VERTICAL
function renderizarModoVertical() {
    const container = document.getElementById('vertical-mode');
    
    // Limpa e re-renderiza
    container.innerHTML = ''; 

    let htmlContent = '';
    
    // Cria uma tag <img> para CADA caminho no array
    readerState.paginasArray.forEach((caminho, index) => {
        // CORREÇÃO: Usa o caminho COMPLETO e pronto
        const caminhoCompleto = caminho; 
        htmlContent += `
            <img 
                src="${caminhoCompleto}" 
                alt="Página ${index + 1}" 
                style="display: block; width: 100%; height: auto; margin-bottom: 5px;"
            />
        `;
    });

    container.innerHTML = htmlContent;
}
// -----------------------------------------------------------------------------
// FUNÇÃO PARA ALTERNAR ENTRE OS MODOS
function alternarModoLeitura(novoModo) {
    if (readerState.modoAtual === novoModo) return;
    
    resetarZoom();

    readerState.modoAtual = novoModo;

    const isPagesMode = (novoModo === 'pages');
    
    // Atualiza a visibilidade dos contêineres
    document.getElementById('pages-mode').style.display = isPagesMode ? 'block' : 'none';
    document.getElementById('vertical-mode').style.display = isPagesMode ? 'none' : 'block';

    // Atualiza a visibilidade dos controles de navegação e contador
    document.getElementById('page-navigation-controls').style.display = isPagesMode ? 'flex' : 'none';
    document.getElementById('page-counter').style.display = isPagesMode ? 'inline' : 'none';
    document.getElementById('zoom-controls').style.display = isPagesMode ? 'flex' : 'none';
    // Atualiza o destaque dos botões
    document.getElementById('mode-pages-btn').classList.toggle('active-mode', isPagesMode);
    document.getElementById('mode-vertical-btn').classList.toggle('active-mode', !isPagesMode);

    // Se mudou para o modo vertical, renderiza as imagens
    if (!isPagesMode) {
        renderizarModoVertical();
    }
}

// -----------------------------------------------------------------------------
//FUNÇÃO DE NAVEGAÇÃO PURA
function navegar(direcao) {
    // Apenas executa a lógica de navegação, sem manipular eventos DOM
    let novoIndice = readerState.indiceAtual + direcao; 
    renderizarPagina(novoIndice);
}
// -----------------------------------------------------------------------------
// FUNÇÕES DE CONTROLE DE ZOOM
const ZOOM_STEP = 20; // Aumento/diminuição de 20%
const ZOOM_MAX = 300; // Máximo de 300%
const ZOOM_MIN = 50;  // Mínimo de 80%

function aplicarZoom() {
    const offsetX = parseFloat(document.getElementById('page-image').dataset.offsetX || 0);
    const offsetY = parseFloat(document.getElementById('page-image').dataset.offsetY || 0);
    
    document.getElementById('page-image').style.transform = 
        `scale(${readerState.zoomLevel / 100}) translate(${offsetX}px, ${offsetY}px)`;
}

function alterarZoom(direcao) {
    if (readerState.modoAtual !== 'pages') {
        console.warn("Zoom só é permitido no Modo Páginas.");
        return;
    }
    
    let novoZoom = readerState.zoomLevel + (direcao * ZOOM_STEP);

    // Limites de controle
    if (novoZoom > ZOOM_MAX) novoZoom = ZOOM_MAX;
    if (novoZoom < ZOOM_MIN) novoZoom = ZOOM_MIN;

    readerState.zoomLevel = novoZoom;
    aplicarZoom();
    
    const imagemElement = document.getElementById('page-image');
    if (novoZoom > 100) {
        imagemElement.classList.add('zoom-active');
    } else {
        imagemElement.classList.remove('zoom-active');
    }
}

function resetarZoom() {
    if (readerState.modoAtual !== 'pages') return;
    
    readerState.zoomLevel = 100;
    
    resetDrag(); 
    
    document.getElementById('page-image').classList.remove('zoom-active');
}
// -----------------------------------------------------------------------------
// FUNÇÕES PARA ARRASTAR (PAN)
function startDrag(e) {
    if (readerState.modoAtual !== 'pages' || readerState.zoomLevel <= 100) return;
    
    // Impede a seleção de texto padrão
    e.preventDefault(); 
    
    readerState.isDragging = true;
    readerState.dragMoved = false; // Reinicia a flag de movimento
    
    // Obtém as coordenadas iniciais do mouse
    readerState.lastX = e.clientX;
    readerState.lastY = e.clientY;

    const imagemElement = document.getElementById('page-image');
    imagemElement.style.cursor = 'grabbing'; // Muda o cursor
}

function duringDrag(e) {
    if (!readerState.isDragging) return;

    // Distância percorrida
    const deltaX = e.clientX - readerState.lastX;
    const deltaY = e.clientY - readerState.lastY;

    // SENSIBILIDADE: Se moveu mais de 5 pixels em qualquer direção, 
    // marca dragMoved como TRUE para bloquear o clique de avançar página.
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        readerState.dragMoved = true;
    }

    const imagemElement = document.getElementById('page-image');
    
    // Obtém a posição atual (offset, se estiver usando transform: translate)
    // Se estiver usando background-position ou transform, use a propriedade correta
    
    // Neste caso, vou usar a propriedade 'left' e 'top' e ajustá-las via CSS
    let currentX = parseFloat(imagemElement.dataset.offsetX || 0);
    let currentY = parseFloat(imagemElement.dataset.offsetY || 0);
    
    let newX = currentX + deltaX;
    let newY = currentY + deltaY;

    // Aplica a nova posição via CSS transform: translate (mantém o zoom 'scale' intacto)
    // Usei um único 'transform' para evitar conflito com 'scale'
    imagemElement.style.transform = `scale(${readerState.zoomLevel / 100}) translate(${newX}px, ${newY}px)`;

    // Salva as novas coordenadas de offset para o próximo frame
    imagemElement.dataset.offsetX = newX;
    imagemElement.dataset.offsetY = newY;

    // Atualiza o lastX/lastY para o próximo movimento
    readerState.lastX = e.clientX;
    readerState.lastY = e.clientY;
}

function endDrag(e) {
    // Retorna falso se não estava arrastando
    if (!readerState.isDragging) return;

    readerState.isDragging = false;
    const imagemElement = document.getElementById('page-image');
    imagemElement.style.cursor = readerState.zoomLevel > 100 ? 'grab' : 'default'; // Restaura o cursor
    
    // Se o arraste foi feito (dragMoved === true), NÃO RETORNE NADA. O navegador
    // não deve registrar isso como um 'click'.
    
    // RETORNA TRUE SE HOUVE ARRASTE PARA QUE POSSAMOS USAR NO CLICK ABAIXO
    return readerState.dragMoved; 
}

// -----------------------------------------------------------------------------
// LIMPEZA: Reseta as propriedades de arraste
function resetDrag() {
    const imagemElement = document.getElementById('page-image');
    
    // Zera os offsets (posições de arraste)
    imagemElement.dataset.offsetX = 0;
    imagemElement.dataset.offsetY = 0;
    
    // Aplica o reset (transform original que só tem o scale ou nada)
    imagemElement.style.transform = `scale(${readerState.zoomLevel / 100})`;
}
// -----------------------------------------------------------------------------
// EVENT HANDLERS (AGORA FORA DE QUALQUER FUNÇÃO DE EVENTO)
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa o leitor
    iniciarLeitor();
    
    // --- 1. EVENTOS DE ZOOM ---
    document.getElementById('zoom-in-btn').addEventListener('click', () => alterarZoom(1));
    document.getElementById('zoom-out-btn').addEventListener('click', () => alterarZoom(-1));
    document.getElementById('zoom-reset-btn').addEventListener('click', resetarZoom);
    
    // --- 2. EVENTOS DE NAVEGAÇÃO ---
    document.getElementById('prev-btn').addEventListener('click', () => navegar(-1));
    document.getElementById('next-btn').addEventListener('click', () => navegar(1));
    
    // --- 3. EVENTOS DE MODO ---
    document.getElementById('mode-pages-btn').addEventListener('click', () => alternarModoLeitura('pages'));
    document.getElementById('mode-vertical-btn').addEventListener('click', () => alternarModoLeitura('vertical'));

    // --- 4. EVENTOS DE ARRASTE (PAN) E CLIQUE (DEVE SER CONFIGURADO UMA ÚNICA VEZ) ---
    const image = document.getElementById('page-image');

    // MOUSE DOWN: Inicia o arraste
    image.addEventListener('mousedown', startDrag);
    
    // MOUSE UP: Termina o arraste OU aciona o avanço de página se não houve arraste
    image.addEventListener('mouseup', (e) => {
        const wasDragged = endDrag(e); // Retorna true se houve movimento

        // Se NÃO houve arraste significativo E estamos no modo páginas, AVANÇA.
        if (!wasDragged && readerState.modoAtual === 'pages') {
            navegar(1);
        }
    });

    // MOUSE MOVE (GLOBAL): Deve ser no document para que o arraste continue mesmo se o mouse sair da imagem
    document.addEventListener('mousemove', duringDrag);

    // MOUSE OUT/LEAVE (GLOBAL): Finaliza arraste se o mouse sair da janela
    document.addEventListener('mouseleave', (e) => {
        readerState.isDragging = false; // Garante que pare o arraste se o mouse fugir da tela
    });

    // --- 5. NAVEGAÇÃO POR TECLAS (LOGICAMENTE DENTRO DO KEYDOWN) ---
    document.addEventListener('keydown', (e) => {
        if (readerState.modoAtual === 'pages') {
            
            // Navegação de Página (Setas/Espaço)
            if (e.key === 'ArrowLeft') {
                navegar(-1);
            } else if (e.key === 'ArrowRight' || e.key === ' ') { 
                navegar(1);
            }
            
            // Zoom por Tecla (Ctrl/Cmd + +/-)
            if (e.ctrlKey || e.metaKey) { 
                if (e.key === '+') {
                    e.preventDefault();
                    alterarZoom(1);
                } else if (e.key === '-') {
                    e.preventDefault();
                    alterarZoom(-1);
                }
            }
        }
    });
});