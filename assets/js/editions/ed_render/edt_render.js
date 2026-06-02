// Componente de Renderização de Edições

var EdtRender = {
    // Função principal para renderizar a lista criando múltiplas estantes se passar de 10
    renderList: function(edicoes, containerId, append = false) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!append) container.innerHTML = '';

        let estanteAtual = null;

        edicoes.forEach((edicao, index) => {
            if(!edicao.id || !edicao.edicao) return;
            
            // A cada 10 itens (index 0, 10, 20, 30...), cria uma nova estante
            if (index % 10 === 0) {
                estanteAtual = document.createElement('div');
                estanteAtual.className = 'hq-shelf-row'; // Nova classe para as estantes dinâmicas
                container.appendChild(estanteAtual);
            }

            const card = this.createCard(edicao);
            
            // Adiciona o card dentro da estante que está ativa no momento
            if (estanteAtual) {
                estanteAtual.appendChild(card);
            }
        });

        // Executa a lógica de controle de hover passando o container pai
        this.initHoverLogic(containerId);
    },

    // Cria o elemento do card individual
    createCard: function(edicao) {
        const div = document.createElement('div');
        div.className = 'hq-shelf-item'; 
        
        let caminhoLimpo = edicao.caminho_capa_cb ? edicao.caminho_capa_cb.replace(/^(\.\.\/|\.\/|\/)+/, '') : '';
        
        const capaUrl = caminhoLimpo 
            ? (window.buildAppUrl ? window.buildAppUrl(caminhoLimpo) : caminhoLimpo)
            : (window.buildAppUrl ? window.buildAppUrl('assets/img/placeholder.jpg') : 'assets/img/placeholder.jpg');

        const leituraBaseUrl = window.buildAppUrl ? window.buildAppUrl('view/read.html') : 'view/read.html';
        const leituraUrl = `${leituraBaseUrl}?id=${edicao.id}`;
        
        div.style.backgroundImage = `url('${capaUrl}')`;
            
        div.innerHTML = `
            <span class="hq-shelf-title">Edição #${edicao.edicao}</span>
            
            <div class="hq-shelf-info-block">
              <p class="hq-shelf-info-text"><strong>Data:</strong> ${edicao.data_lancamento_formatada}</p>
              <p class="hq-shelf-info-text"><strong>Páginas:</strong> ${edicao.paginas} págs</p>
            </div>

            <div class="hq-shelf-read-wrapper">
              <div class="hq-shelf-btn-read">
                <a href="${leituraUrl}" style="color: inherit; text-decoration: none; display: block;">
                  Ler Edição
                </a>
              </div>
              <div class="hq-shelf-btn-read-dashed"></div>
            </div>
            
            <div class="hq-shelf-actions-block">
              <button class="hq-shelf-btn hq-shelf-btn-edit" title="Editar">
                <i class="fas fa-edit"></i>
              </button>
              <button class="hq-shelf-btn hq-shelf-btn-delete" title="Deletar">
                <i class="fas fa-trash"></i>
              </button>
            </div>
        `;

        return div;
    },

    // Ajustado para capturar os cards de todas as estantes criadas
    initHoverLogic: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Captura todos os cards dentro do container geral
        const cards = container.querySelectorAll('.hq-shelf-item');

        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                cards.forEach(c => c.classList.remove('is-expanded', 'is-blocked'));
                
                card.classList.add('is-expanded');
                cards.forEach(c => {
                    if (c !== card) c.classList.add('is-blocked');
                });
            });

            card.addEventListener('mouseleave', () => {
                cards.forEach(c => c.classList.remove('is-expanded', 'is-blocked'));
            });
        });
    }
};