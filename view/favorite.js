{
    // 1. Definição da limpeza (removendo o que é específico desta página)
    window.pageCleanup = () => {
        console.log("Executando limpeza da página de Favoritos...");
        
        // Remove scripts injetados nesta navegação
        document.querySelectorAll('.page-script').forEach(s => s.remove());
        
        // Limpa as funções dos botões para evitar conflitos na próxima página
        delete window.abrirModalEdicao;
        delete window.fecharModalEdicao;
        delete window.setupEditFormListener;
        delete window.toggleFavorito;
        delete window.mostrarModalConfirmacao;
        delete window.deletarTitulo;
    };

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
            // 1. Carrega os comportamentos dos botões (Módulos Individuais)
            await Promise.all([
                load("btn_favorite.js"),
                load("btn_edit.js"),
                load("btn_delete.js")
            ]);

            // 2. Importa o motor da lista
            await import(`assets/js/title_list.js?v=${Date.now()}`);
            
            // 3. Ativa o formulário de edição que agora está no modal global
            if (typeof window.setupEditFormListener === 'function') {
                window.setupEditFormListener();
            }

            // 4. Carrega os dados da API
            if (typeof window.carregarListaTitulos === 'function') {
                window.carregarListaTitulos('mode=favorites', false);
            }
        } catch (err) {
            console.error("Erro na inicialização de Favoritos:", err);
        }
    }

    init();
}