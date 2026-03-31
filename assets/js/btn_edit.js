{
    const API_PATH = 'php/api_actions.php';

    window.abrirModalEdicao = async (id) => {
        const modal = document.getElementById('modalEdicaoTitulo');
        const loading = document.getElementById('edit_loading_message');
        const form = document.getElementById('formEdicaoTitulo');

        if (!modal || !form) return;

        form.reset();
        loading.textContent = 'Carregando dados...';
        loading.style.display = 'block';
        modal.style.display = 'flex';

        try {
            const response = await fetch(API_PATH, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_titulo_data', id_titulo: id })
            });
            const data = await response.json();

            if (data.status === 'sucesso') {
                const t = data.titulo_data;
                
                // 1. Preenche o ID (usando 'id' vindo do banco)
                const inputId = document.getElementById('edit_id_titulo');
                if (inputId) {
                    inputId.value = t.id; 
                    console.log("ID inserido no campo hidden:", t.id);
                }

                // 2. Preenche os demais campos para o usuário editar
                document.getElementById('edit_titulo').value = t.titulo;
                document.getElementById('edit_original').value = t.original || '';
                document.getElementById('edit_lancamento').value = t.lancamento;
                document.getElementById('edit_genero').value = t.genero;
                document.getElementById('edit_Publisher').value = t.editora;

                loading.style.display = 'none';
            }
        } catch (error) {
            loading.textContent = 'Erro ao carregar dados.';
            console.error(error);
        }
    };

    window.fecharModalEdicao = () => {
        const modal = document.getElementById('modalEdicaoTitulo');
        if (modal) modal.style.display = 'none';
    };

    window.setupEditFormListener = () => {
        const form = document.getElementById('formEdicaoTitulo');
        if (!form) return;

        form.onsubmit = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('saveButton');
            const spinner = document.getElementById('editSpinner');
            
            btn.disabled = true;
            if (spinner) spinner.style.display = 'inline-block';

            const formData = new FormData(form);
            const payload = { action: 'update_titulo' };
            
            formData.forEach((value, key) => payload[key] = value);
            
            // Força a captura do ID do campo hidden
            const idReal = document.getElementById('edit_id_titulo').value;
            payload.id_titulo = idReal;
            
            console.log("Enviando Payload para atualização:", payload);

            try {
                const response = await fetch(API_PATH, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const res = await response.json();

                if (res.status === 'sucesso') {
                    window.fecharModalEdicao();
                    if (window.carregarListaTitulos) {
                        // Recarrega a lista para mostrar os nomes novos
                        window.carregarListaTitulos(window.location.search.substring(1) || 'mode=all', false);
                    }
                } else {
                    alert(res.mensagem);
                }
            } catch (error) {
                console.error("Erro ao salvar:", error);
            } finally {
                btn.disabled = false;
                if (spinner) spinner.style.display = 'none';
            }
        };
    };
}