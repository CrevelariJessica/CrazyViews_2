{
    const API_PATH = 'php/api_actions.php';
    let idParaDeletar = null;

    // 1. Abre o modal de confirmação e armazena o ID
    window.mostrarModalConfirmacao = (id) => {
        idParaDeletar = id;
        const modal = document.getElementById('modalConfirmacaoExclusao');
        if (modal) {
            modal.style.display = 'flex';
        }
    };

    // 2. Fecha o modal e limpa o ID temporário
    window.fecharModalConfirmacao = () => {
        idParaDeletar = null;
        const modal = document.getElementById('modalConfirmacaoExclusao');
        if (modal) {
            modal.style.display = 'none';
        }
    };

    // 3. Executa a exclusão definitiva
    window.deletarTitulo = async () => {
        if (!idParaDeletar) return;

        try {
            const response = await fetch(API_PATH, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'delete_titulo', 
                    id_titulo: idParaDeletar 
                })
            });

            const data = await response.json();

            if (data.status === 'sucesso') {
                // Fecha o modal
                window.fecharModalConfirmacao();

                // Recarrega a lista para refletir a exclusão (mantendo o modo atual)
                if (typeof window.carregarListaTitulos === 'function') {
                    window.carregarListaTitulos(window.location.search.substring(1), false);
                }
                
                // Atualiza contadores do dashboard se necessário
                if (typeof window.carregarContadoresGerais === 'function') {
                    window.carregarContadoresGerais();
                }
            } else {
                alert("Erro ao excluir: " + data.mensagem);
            }
        } catch (error) {
            console.error("Erro na requisição de exclusão:", error);
            alert("Erro de conexão ao tentar excluir.");
        }
    };

    // --- CLEANUP ---
    window.deleteBtnCleanup = () => {
        idParaDeletar = null;
        delete window.mostrarModalConfirmacao;
        delete window.fecharModalConfirmacao;
        delete window.deletarTitulo;
    };
}