window.TitleListCtx = window.TitleListCtx || {};

window.TitleListCtx.renderizarCards = function(titulos, containerId, appendResults = false) {
    const containerCards = document.getElementById(containerId);
    if (!containerCards) return;

    if (!appendResults) {
        containerCards.innerHTML = ''; // Limpa o container se não for paginação
    }

    const placeholderUrl = window.buildAppUrl ? window.buildAppUrl('assets/img/placeholder.jpg') : '../assets/img/placeholder.jpg'; 
    const DB_PATH_PREFIX = window.buildAppUrl ? '' : '../'; 
    
    titulos.forEach(titulo => {
        const cardWrapper = document.createElement('div');
        cardWrapper.classList.add('card_lib');

        const rawCapaUrl = titulo.url_capa;
        const finalCapaUrl = rawCapaUrl
            ? (window.buildAppUrl ? window.buildAppUrl(rawCapaUrl) : DB_PATH_PREFIX + rawCapaUrl)
            : placeholderUrl;
        
        // Renderização da estrutura HTML injetando links com suporte SPA
        cardWrapper.innerHTML = `
        <div class="holder-card-title">
            <div class="book">
                <div class="lib_cardInfo">
                    <a href="${window.buildRouteUrl ? window.buildRouteUrl('templateUpdate', { id: titulo.id_titulo }) : `principal.html?page=templateUpdate&id=${titulo.id_titulo}`}" class="lib_cardT">
                        <h3 title="${titulo.titulo}">${titulo.titulo}</h3>
                    </a>
                    <p class="lib_cardO" title="${titulo.original}">${titulo.original}</p>
                    <div class="lib_cardIn">
                        <p class="lib_cardE">Ano: ${titulo.lancamento}</p>
                        <p class="lib_cardE">Edições: ${titulo.edicoes_por_titulo}</p>
                    </div>
                    <p class="lib_cardE">Gênero: ${titulo.genero}</p>
                </div>

                <div class="cover">
                    <div class="lib_card">
                        <div class="lib_cardImag">
                            <img src="${finalCapaUrl}" 
                                 alt="Capa de ${titulo.titulo}" 
                                 class="card_capa_img"
                                 onerror="this.onerror=null; this.src='${placeholderUrl}';">
                        </div>
                    </div>
                </div>
            </div>
            
            <ul class="example-2">
                <li class="icon-content">
                  <a data-social="favorite" aria-label="Favoritar" href="javascript:void(0)">
                    <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
                  </a>
                  <div class="tooltip">Favorito</div>
                </li>

                <li class="icon-content">
                  <a data-social="edit" aria-label="Editar" href="javascript:void(0)" onclick="window.abrirMenuEdicao(this, '${titulo.id_titulo || titulo.id}')">
                    <svg viewBox="0 0 24 24" height="24" width="24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>
                  </a>
                  <div class="tooltip">Editar</div>
                </li>

                <li class="icon-content">
                  <a data-social="delete" aria-label="Deletar" href="javascript:void(0)" onclick="if(typeof window.mostrarModalConfirmacao === 'function') { window.mostrarModalConfirmacao('${titulo.id_titulo || titulo.id}'); }">
                    <svg viewBox="0 0 24 24" height="24" width="24"><path d="M15 4V3H9v1H4v2h1v13c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V6h1V4h-5zM9 5h6v1H9V5zm8 14H7V6h10v13zM9 8h2v9H9V8zm4 0h2v9h2V8z"></path></svg>
                  </a>
                  <div class="tooltip">Deletar</div>
                </li>
            </ul>
        </div>`;
        
        containerCards.appendChild(cardWrapper);
    });
};