{
    const MODAL_API_PATH = 'php/api_actions.php';
    let tituloIdAtual = null;

    // --- FUNÇÕES DE INTERFACE ---
    window.fecharModalEdicao = function() {
        const modal = document.getElementById('modalEdicaoTitulo');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('edit_loading_message').style.display = 'none';
            document.getElementById('edit_feedback_message').style.display = 'none';
            document.getElementById('editSpinner').style.display = 'none';
            document.getElementById('saveButton').disabled = false;
        }
    };

    window.preencherFormulario = function(titulo) {
        if (!titulo) return;
        document.getElementById('edit_id_titulo').value = titulo.id_titulo || '';
        document.getElementById('edit_titulo').value = titulo.titulo || '';
        document.getElementById('edit_original').value = titulo.original || '';
        document.getElementById('edit_lancamento').value = titulo.lancamento || '';
        document.getElementById('edit_genero').value = titulo.genero || '';
        document.getElementById('edit_Publisher').value = titulo.editora || '';
    };

    window.abrirModalEdicao = async function(tituloId) {
        const modal = document.getElementById('modalEdicaoTitulo');
        const loadingMessage = document.getElementById('edit_loading_message');
        const form = document.getElementById('formEdicaoTitulo');

        if (!modal || !form) return;

        tituloIdAtual = tituloId;
        form.reset();
        document.getElementById('edit_feedback_message').style.display = 'none';
        document.getElementById('saveButton').disabled = false;

        loadingMessage.textContent = 'Carregando dados...';
        loadingMessage.style.display = 'block';
        modal.style.display = 'flex';

        try {
            const response = await fetch(MODAL_API_PATH, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_titulo_data', id_titulo: tituloId })
            });
            const data = await response.json();

            if (data.status === 'sucesso') {
                window.preencherFormulario(data.titulo_data);
                loadingMessage.style.display = 'none';
            } else {
                throw new Error(data.mensagem);
            }
        } catch (error) {
            loadingMessage.textContent = 'Erro: ' + error.message;
            document.getElementById('saveButton').disabled = true;
        }
    };

    // --- SUBMISSÃO DO FORMULÁRIO (CHAMADA MANUAL) ---
    window.setupEditFormListener = function() {
        const form = document.getElementById('formEdicaoTitulo');
        if (!form) return;

        // Sobrescreve o onsubmit para garantir que não duplique listeners
        form.onsubmit = async function(e) {
            e.preventDefault();
            const saveButton = document.getElementById('saveButton');
            const spinner = document.getElementById('editSpinner');
            const feedbackMsg = document.getElementById('edit_feedback_message');

            saveButton.disabled = true;
            spinner.style.display = 'inline-block';

            const formData = new FormData(form);
            const payload = { action: 'update_titulo' };
            formData.forEach((value, key) => payload[key] = value);

            try {
                const response = await fetch(MODAL_API_PATH, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await response.json();

                if (data.status === 'sucesso') {
                    if (window.carregarListaTitulos) window.carregarListaTitulos(window.location.search.substring(1), false);
                    window.fecharModalEdicao();
                    alert('Atualizado com sucesso!'); // Ou use seu showGlobalFeedback
                } else {
                    throw new Error(data.mensagem);
                }
            } catch (error) {
                feedbackMsg.textContent = error.message;
                feedbackMsg.style.display = 'block';
                saveButton.disabled = false;
            } finally {
                spinner.style.display = 'none';
            }
        };
    };

    // --- EXCLUSÃO ---
    window.mostrarModalConfirmacao = function(id) {
        tituloIdAtual = id;
        const modal = document.getElementById('modalConfirmacaoExclusao');
        if (modal) modal.style.display = 'flex';
    };

    window.fecharModalConfirmacao = function() {
        const modal = document.getElementById('modalConfirmacaoExclusao');
        if (modal) modal.style.display = 'none';
    };

    window.deletarTitulo = async function() {
        if (!tituloIdAtual) return;
        try {
            const response = await fetch(MODAL_API_PATH, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_titulo', id_titulo: tituloIdAtual })
            });
            const data = await response.json();
            if (data.status === 'sucesso') {
                if (window.carregarListaTitulos) window.carregarListaTitulos(window.location.search.substring(1), false);
                window.fecharModalConfirmacao();
            }
        } catch (error) {
            console.error(error);
        }
    };
    
    // Inicia o listener imediatamente caso o script seja carregado via SPA
    window.setupEditFormListener();
}