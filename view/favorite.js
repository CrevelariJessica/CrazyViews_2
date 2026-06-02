{
    // 1. Definição da limpeza (removendo o que é específico desta página)
    window.pageCleanup = () => {
        console.log("Executando limpeza da página de Favoritos...");
        
        // Remove scripts injetados nesta navegação
        document.querySelectorAll('.page-script').forEach(s => s.remove());
        
        // Limpa as funções dos botões e referências globais para evitar conflitos na próxima página
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

    window.PATH_API = 'php/api_title_list.php'; 

    // Função auxiliar para carregar scripts de forma dinâmica e limpa
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
            // 1. Carrega os comportamentos dos botões (Módulos Individuais)
            await Promise.all([
                load("/assets/js/titles/tit_button/btn_favorite.js"),
                load("/assets/js/titles/tit_button/btn_edit.js"),
                load("/assets/js/titles/tit_button/btn_delete.js")
            ]);

            // 2. O nav_spa.js já injetou a engrenagem da lista (render, fetcher, pagination, manager).
                        
            // 3. Ativa o formulário de edição que agora está no modal global
            if (typeof window.setupEditFormListener === 'function') {
                window.setupEditFormListener();
                console.log("Formulário de edição vinculado ao Modal Global (Favoritos).");
            }

            // 4. Carrega os dados da API focando apenas nos favoritos
            if (typeof window.carregarListaTitulos === 'function') {
                window.carregarListaTitulos('mode=favorites', false);
            }
        } catch (err) {
            console.error("Erro na inicialização de Favoritos:", err);
        }
    }

    init();
}