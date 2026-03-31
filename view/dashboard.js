{
    console.log("Iniciando Hierarquia: Dashboard na pasta View");

    // 1. Define variável global absoluta para a API
    window.PATH_API = ' ';

    // 2. Função de carregamento usando caminho absoluto do projeto
    const loadScript = (src) => {
        const s = document.createElement('script');
        s.src = `assets/js/${src}?v=${Date.now()}`;
        document.body.appendChild(s);
    };

    // Carrega o modal (Script comum)
    loadScript("modal_title.js");

    // 3. Import dinâmico com caminho ABSOLUTO
    import(`assets/js/index_dashboard.js?v=${Date.now()}`)
        .then(() => {
            console.log("Módulo Dashboard carregado via caminho absoluto.");
            
            // --- MODIFICAÇÃO AQUI ---
            // Em vez de chamar apenas os contadores, chamamar a função que 
            // vincula os eventos de pesquisa ao novo formulário injetado.
            if (typeof window.iniciarFiltros === 'function') {
                window.iniciarFiltros();
            } else if (typeof window.carregarContadoresGerais === 'function') {
                // Fallback caso a função iniciarFiltros ainda não esteja pronta
                window.carregarContadoresGerais();
            }
        })
        .catch(err => console.error("Erro ao carregar módulo dashboard:", err));
}