const MODAL_API_PATH = '../php/api_actions.php';
let tituloIdAtual = null; // Armazena o ID do título sendo editado

function fecharModalEdicao() {
    const modal = document.getElementById('modalEdicaoTitulo');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('edit_loading_message').style.display = 'none';
        document.getElementById('edit_feedback_message').style.display = 'none';
        document.getElementById('editSpinner').style.display = 'none';
        document.getElementById('saveButton').disabled = false;
    }
}
function preencherFormulario(titulo) {
    if (!titulo) return;

    document.getElementById('edit_id_titulo').value = titulo.id || '';
    document.getElementById('edit_titulo').value = titulo.titulo || '';
    document.getElementById('edit_original').value = titulo.original || '';
    document.getElementById('edit_lancamento').value = titulo.lancamento || '';
    document.getElementById('edit_genero').value = titulo.genero || '';
    document.getElementById('edit_Publisher').value = titulo.editora || '';
    
    const capaInfo = document.getElementById('edit_capa_atual');
    if (capaInfo) {
        capaInfo.textContent = titulo.capa_url
            ? `Capa atual: ${titulo.capa_url.substring(titulo.capa_url.lastIndexOf('/') + 1)}`
            : 'Capa não definida.';
    }
}
async function abrirModalEdicao(tituloId) {
    const modal = document.getElementById('modalEdicaoTitulo');
    const loadingMessage = document.getElementById('edit_loading_message');
    const form = document.getElementById('formEdicaoTitulo');

    if (!modal || !form || !loadingMessage) {
        console.error('Elementos do modal de edição não encontrados no DOM.');
        return;
    }

    tituloIdAtual = tituloId;
    form.reset();
    document.getElementById('edit_feedback_message').style.display = 'none';
    document.getElementById('saveButton').disabled = false;

    loadingMessage.textContent = 'Carregando dados do título...';
    loadingMessage.style.display = 'block';
    modal.style.display = 'flex';

    try {
        const payload = {
            action: 'get_titulo_data',
            id_titulo: tituloId
        };

        const response = await fetch(MODAL_API_PATH, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'sucesso' && data.titulo_data && Object.keys(data.titulo_data).length > 0) {
            preencherFormulario(data.titulo_data);
            loadingMessage.style.display = 'none';
        } else {
            throw new Error(data.mensagem || 'Título não encontrado ou resposta da API inválida.');
        }

    } catch (error) {
        console.error('Erro ao carregar dados do título:', error);
        loadingMessage.textContent = 'Erro ao carregar os dados. Detalhe: ' + error.message;
        loadingMessage.style.color = 'red';
        document.getElementById('saveButton').disabled = true;
    }
}
function showGlobalFeedback(message, type) {
    const globalFeedback = document.getElementById('feedback_message');
    if (!globalFeedback) return;

    globalFeedback.textContent = message;
    globalFeedback.style.padding = '10px';
    globalFeedback.style.borderRadius = '8px';
    globalFeedback.style.textAlign = 'center';
    
    if (type === 'success') {
        globalFeedback.style.backgroundColor = '#d4edda';
        globalFeedback.style.color = '#155724';
    } else {
        globalFeedback.style.backgroundColor = '#f8d7da';
        globalFeedback.style.color = '#721c24';
    }

    globalFeedback.style.display = 'block';

    setTimeout(() => {
        globalFeedback.style.display = 'none';
    }, 3000);
}
function setupEditFormListener() {
    const form = document.getElementById('formEdicaoTitulo');
    if (!form) {
        console.error('Formulário de Edição (formEdicaoTitulo) não encontrado.');
        return;
    }

    const saveButton = document.getElementById('saveButton');
    const spinner = document.getElementById('editSpinner');
    const feedbackMsg = document.getElementById('edit_feedback_message');
    const loadingMsg = document.getElementById('edit_loading_message');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        loadingMsg.style.display = 'none';
        feedbackMsg.style.display = 'none';
        saveButton.disabled = true;
        spinner.style.display = 'inline-block';

        const formData = new FormData(form);
        const payload = { action: 'update_titulo' };

        for (const [key, value] of formData.entries()) {
            payload[key] = value;
        }

        try {
            const response = await fetch(MODAL_API_PATH, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 'sucesso') {
                if (typeof window.carregarListaTitulos === 'function') {
                    window.carregarListaTitulos(window.location.search.substring(1), false);
                }
                
                showGlobalFeedback(data.mensagem || 'Título atualizado com sucesso!', 'success');
                
                fecharModalEdicao();
                return; 
                
            } else {
                throw new Error(data.mensagem || 'Falha desconhecida ao atualizar.');
            }

        } catch (error) {
            console.error('Erro na submissão do formulário:', error);
            
            feedbackMsg.textContent = 'Erro ao salvar: ' + error.message;
            feedbackMsg.style.color = 'red';
            feedbackMsg.style.display = 'block';
            saveButton.disabled = false;

        } finally {
            if (spinner.style.display !== 'none') {
                spinner.style.display = 'none';
            }
        }
    });
}
document.addEventListener('DOMContentLoaded', setupEditFormListener);

function mostrarModalConfirmacao(id) {
    tituloIdAtual = id;
    const modal = document.getElementById('modalConfirmacaoExclusao');
    if (modal) {
        modal.style.display = 'flex';
    }
}
function fecharModalConfirmacao() {
    const modal = document.getElementById('modalConfirmacaoExclusao');
    if (modal) {
        modal.style.display = 'none';
    }
}
async function deletarTitulo() {
    if (!tituloIdAtual) {
        console.error("ID do título não definido para exclusão.");
        return;
    }

    fecharModalConfirmacao();
    
    try {
        const payload = {
            action: 'delete_titulo',
            id_titulo: tituloIdAtual
        };

        const response = await fetch(MODAL_API_PATH, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.status === 'sucesso') {
            if (typeof window.carregarListaTitulos === 'function') {
                window.carregarListaTitulos(window.location.search.substring(1), false);
            }
            
            showGlobalFeedback(data.mensagem || 'Título excluído com sucesso!', 'success');


        } else {
            console.error("Erro na exclusão:", data.mensagem);
            showGlobalFeedback(`Falha na exclusão: ${data.mensagem}`, 'error');
        }

    } catch (error) {
        console.error("Erro na requisição de exclusão:", error);
        showGlobalFeedback("Erro de rede ao tentar deletar o título.", 'error');

    } finally {
        tituloIdAtual = null;
    }
}