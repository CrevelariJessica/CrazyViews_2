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

        if (typeof window.titleListCleanup === 'function') window.titleListCleanup();
    };

    // Configuração do caminho da API para esta página
    window.PATH_API = 'php/api_title_list.php'; 

    const load = (path) => new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = `assets/js/${path}?v=${Date.now()}`;
        s.className = 'page-script'; 
        s.onload = resolve;
        s.onerror = reject;
        document.body.appendChild(s);
    });

    async function init() {
        try {
            // 1. Carrega todos os comportamentos dos botões (Módulos Individuais)
            await Promise.all([
                load("btn_favorite.js"),
                load("btn_edit.js"),
                load("btn_delete.js")
            ]);

            // 2. Importa o motor da lista de títulos
            await import(`assets/js/title_list.js?v=${Date.now()}`);

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