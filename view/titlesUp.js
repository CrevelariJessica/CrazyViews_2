{
    // 1. Definição da limpeza (executada ao trocar de página)
    window.pageCleanup = () => {
        console.log("Limpando página de Títulos Enviados...");

        // Remove scripts injetados nesta navegação
        document.querySelectorAll('.page-script').forEach(s => s.remove());
        
        // Limpa referências globais desta página e funções dos botões
        delete window.PATH_API;
        delete window.abrirModalEdicao;
        delete window.fecharModalEdicao;
        delete window.setupEditFormListener;
        delete window.toggleFavorito;
        delete window.mostrarModalConfirmacao;
        delete window.deletarTitulo;
        delete window.TitleListCtx; // Limpa o contexto global da lista

        if (typeof window.titleListCleanup === 'function') window.titleListCleanup();
    };

    // Configuração do caminho da API para esta página
    window.PATH_API = 'php/api_title_list.php'; 

    // Função auxiliar para carregar scripts dinamicamente
    const load = (fullPath) => new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = `${fullPath}?v=${Date.now()}`;
        s.className = 'page-script'; 
        s.onload = resolve;
        s.onerror = reject;
        document.body.appendChild(s);
    });

    async function init() {
        try {
            // 1. Carrega todos os comportamentos dos botões (Módulos Individuais)
            await Promise.all([
                load("/assets/js/titles/tit_button/btn_favorite.js"),
                load("/assets/js/titles/tit_button/btn_edit.js"),
                load("/assets/js/titles/tit_button/btn_delete.js")
            ]);

            // 2. Carrega a engrenagem e os pedaços da lista que separamos
            await load("/assets/js/titles/tit_render/title_card_render.js");
            await load("/assets/js/titles/tit_render/title_fetcher.js");
            await load("/assets/js/titles/tit_render/title_pagination.js");
            await load("/assets/js/titles/title_list_manager.js"); // O Pilar da lista

            // 3. Ativa o ouvinte do formulário de edição que reside no modal global
            if (typeof window.setupEditFormListener === 'function') {
                window.setupEditFormListener();
                console.log("Formulário de edição vinculado ao Modal Global.");
            }

            // 4. Carrega a lista de títulos (modo 'all' para Títulos Enviados)
            if (typeof window.carregarListaTitulos === 'function') {
                window.carregarListaTitulos('mode=all', false);
            }
        } catch (err) {
            console.error("Erro ao inicializar titlesUp:", err);
        }
    }

    init();
}