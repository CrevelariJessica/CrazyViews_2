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
            ? (window.buildAppUrl ? window.buildAppUrl(caminhoLimpo) : caminhoLimpo)
            : (window.buildAppUrl ? window.buildAppUrl('assets/img/placeholder.jpg') : 'assets/img/placeholder.jpg');

    // DEBUG para confirmar a limpeza
    console.log("Caminho Processado:", capaUrl);

    const leituraBaseUrl = window.buildAppUrl ? window.buildAppUrl('view/read.html') : 'view/read.html';
    const leituraUrl = `${leituraBaseUrl}?id=${edicao.id}`;
    
    console.log("URL Final da Capa:", capaUrl);
            
        div.innerHTML = `
        <img src="${capaUrl}" alt="Capa da Edição #${edicao.edicao}" class="capa-background">

           

            <div class="conteudo-overlay">

             

              <div class="lombada-conteudo">

                <h3 class="cardTitle">Edição #${edicao.edicao}</h3>

              </div>

             

              <div class="detalhes-edicao">

                <p class="cardDateP">Data: ${edicao.data_lancamento_formatada}</p>

                <p class="cardDateP">${edicao.paginas} páginas</p>

                <a href="${leituraUrl}" class="cardLink">Ler</a>

              </div>

             

              <div class="acoes-edicao">

                <button class="btn-editar" data-id="${edicao.id}">Editar</button>

                <button class="btn-deletar" data-id="${edicao.id}">Deletar</button>

              </div>



            </div> 


        `;
        return div;
    }
};