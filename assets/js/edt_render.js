/**
 * Componente de Renderização de Edições
 */

var EdtRender = {
    // Função principal para renderizar a lista
    renderList: function(edicoes, containerId, append = false) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!append) container.innerHTML = '';

        edicoes.forEach(edicao => {
            if(!edicao.id || !edicao.edicao) return;
            const card = this.createCard(edicao);
            container.appendChild(card);
        });
    },

    // Cria o elemento do card individual
    createCard: function(edicao) {
        const div = document.createElement('div');
        div.className = 'cardEdition';
        
        // 1. Limpa o caminho: remove "../", "./" e "/" do início da string
        let caminhoLimpo = edicao.caminho_capa_cb ? edicao.caminho_capa_cb.replace(/^(\.\.\/|\.\/|\/)+/, '') : '';
        
        // DEBUG: Vamos ver o que chega do banco e o que o JS decide
        console.log("ID Edição:", edicao.id, "Caminho Original:", edicao.caminho_capa_cb);
    
        // 2. Monta a URL absoluta a partir da raiz do servidor
        const capaUrl = caminhoLimpo 
            ? `/hq_app/${caminhoLimpo}` 
            : '/hq_app/assets/img/placeholder.jpg';

    // DEBUG para confirmar a limpeza
    console.log("Caminho Processado:", capaUrl);

    const leituraUrl = `view/read.html?id=${edicao.id}`;
    
    console.log("URL Final da Capa:", capaUrl);
            
        div.innerHTML = `
            <div class="edition-actions-container">
                <button class="btn-edition-menu">...</button>
                
                <div class="edition-menu-options" style="display: none;">
                    <a href="#" class="menu-option btn-edit-info" 
                       data-id="${edicao.id}" 
                       data-numero="${edicao.edicao}" 
                       data-date="${edicao.data_lancamento}">
                       Editar Informações
                    </a>
                    
                    <a href="#" class="menu-option btn-edit-pages" 
                       data-id="${edicao.id}">
                       Editar Páginas
                    </a>
                    
                    <a href="#" class="menu-option btn-open-delete" 
                       data-id="${edicao.id}" 
                       data-numero="${edicao.edicao}">
                       Deletar Edição
                    </a>
                </div>
            </div>
            
            <div class="cardImage">
                <img src="${capaUrl}" alt="Capa da Edição #${edicao.edicao}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            
            <div class="cardText">
                <h3 class="cardTitle">Edição #${edicao.edicao}</h3>
                <p class="cardDateP">Data da Edição: ${edicao.data_lancamento_formatada}</p>
                <p class="cardDateP">${edicao.paginas} páginas</p>
                <a href="${leituraUrl}" class="cardLink">Ler</a>
            </div>
        `;
        return div;
    }
};