{
    /**
     * Controlador da Página de Atualização de Títulos e Edições
     */

    // 1. GESTÃO DE CICLO DE VIDA (CLEANUP SPA)
    window.pageCleanup = () => {
        console.log("Limpando a página de Edição de Templates...");
        
        // Remove ouvintes globais adicionados nesta tela para não vazar memória
        document.removeEventListener('click', fecharMenusOpcoes);
        
        // Limpa o contexto de validação que injetamos via nav_spa
        delete window.PageEditionCtx;
        delete window.validateUploadForm;
        delete window.maskDate;
        delete window.maskNunberOnly;
        delete window.validateEdition;
        delete window.validateDate;
    };

    // Referências do DOM
    const containerEdicoes = document.getElementById('EditionList');
    const btnAddToggle = document.getElementById('button_addEdt');
    const formContainer = document.getElementById('form_NewEdt');
    const uploadForm = document.getElementById('uploadForm');
    const feedback = document.getElementById('feedback_ajax');
    const formEdit = document.getElementById('editEditionForm');
    const btnConfirmDel = document.getElementById('confirmDeleteButton');

    // --- GESTÃO DE NOVA EDIÇÃO (EXPANSÍVEL) ---
    if (btnAddToggle) {
        btnAddToggle.onclick = () => {
            formContainer.classList.toggle('is-open');

            if (formContainer.classList.contains('is-open')) {
                const idTitulo = new URLSearchParams(window.location.search).get('id');
                if (idTitulo) {
                    document.querySelectorAll('input[name="id_titulo"]').forEach(el => el.value = idTitulo);
                    console.log("ID do título configurado para upload:", idTitulo);
                }
            }
        };
    }

    // --- SUBMISSÃO AJAX (NOVA EDIÇÃO) ---
    if (uploadForm) {
        uploadForm.onsubmit = async function(e) {
            e.preventDefault();

            // Executa a validação unificada que criamos no page_edition_manager.js
            if (typeof window.validateUploadForm === 'function' && !window.validateUploadForm()) {
                return; // Trava o envio se a máscara/validador apontar erro
            }

            feedback.textContent = "Processando upload, por favor aguarde...";
            feedback.style.color = "#256eff";

            const formData = new FormData(this);
            const btnSubmit = this.querySelector('button[type="submit"]');

            try {
                btnSubmit.disabled = true;

                const response = await fetch(this.action, {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.status === 'sucesso') {
                    feedback.textContent = result.mensagem;
                    feedback.style.color = "green";
                    
                    uploadForm.reset();
                    setTimeout(() => {
                        formContainer.classList.remove('is-open');
                        feedback.textContent = "";
                        const idTitulo = new URLSearchParams(window.location.search).get('id');
                        if (typeof window.carregarEdicoes === 'function') window.carregarEdicoes(idTitulo, 0, 10, false);
                    }, 2000);

                } else {
                    feedback.textContent = "Erro: " + result.mensagem;
                    feedback.style.color = "red";
                }
            } catch (error) {
                console.error("Erro no processo:", error);
                feedback.textContent = "Erro crítico na comunicação com o servidor.";
                feedback.style.color = "red";
            } finally {
                btnSubmit.disabled = false;
            }
        };
    }

    // --- DELEGAÇÃO DE EVENTOS NA LISTA DE EDIÇÕES ---
    if (containerEdicoes) {
        containerEdicoes.onclick = (e) => {
            const target = e.target;
            const ctx = window.PageEditionCtx; // Atalho para nossos validadores implodidos

            // ABRIR MENU DE OPÇÕES (...)
            if (target.classList.contains('btn-edition-menu')) {
                const menu = target.nextElementSibling;
                document.querySelectorAll('.edition-menu-options').forEach(m => {
                    if (m !== menu) m.style.display = 'none';
                });
                menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
                e.stopPropagation();
                return;
            }

            // ABRIR MODAL DE EDIÇÃO (INFO)
            if (target.classList.contains('btn-edit-info')) {
                e.preventDefault();
                const { id, numero, date } = target.dataset;
                
                document.getElementById('modalEditionId').value = id;
                document.getElementById('modalEditionNumber').value = numero;
                
                // CORRIGIDO: Agora aponta para dentro do Namespace modificado
                if (ctx && typeof ctx.convertToDisplayDate === 'function') {
                    document.getElementById('modalEditionDate').value = ctx.convertToDisplayDate(date);
                } else {
                    document.getElementById('modalEditionDate').value = date;
                }
                
                document.getElementById('editModal').style.display = 'flex';
            }

            // ABRIR MODAL DE DELEÇÃO
            if (target.classList.contains('btn-open-delete')) {
                e.preventDefault();
                const { id, numero } = target.dataset;
                
                document.getElementById('editionToDeleteInfo').textContent = `Edição #${numero}`;
                document.getElementById('confirmDeleteButton').setAttribute('data-id', id);
                
                document.getElementById('deleteConfirmModal').style.display = 'flex';
            }

            // REDIRECIONAR PARA EDIÇÃO DE PÁGINAS
            if (target.classList.contains('btn-edit-pages')) {
                e.preventDefault();
                const id = target.dataset.id;
                if (typeof window.carregarConteudo === 'function') {
                    window.carregarConteudo(`templatePages.html?id_edicao=${id}`);
                }
            }
        };
    }

    // --- SUBMISSÃO DO FORMULÁRIO DE EDIÇÃO (MODAL) ---
    if (formEdit) {
        formEdit.onsubmit = async function(e) {
            e.preventDefault();
            const ctx = window.PageEditionCtx;

            const dateInput = document.getElementById('modalEditionDate').value;
            
            // CORRIGIDO: Validação usando o namespace novo
            if (ctx && typeof ctx.validateFormatDate === 'function' && !ctx.validateFormatDate(dateInput)) {
                alert("Data inválida! Use o formato MM/AAAA.");
                return;
            }

            const formData = new FormData(this);
            
            // CORRIGIDO: Conversão usando o namespace novo
            if (ctx && typeof ctx.convertToDBDate === 'function') {
                formData.set('data', ctx.convertToDBDate(dateInput));
            }

            try {
                const response = await fetch('php/api_update_edition.php', { method: 'POST', body: formData });
                const result = await response.json();

                if (result.status === 'sucesso') {
                    alert(result.mensagem);
                    document.getElementById('editModal').style.display = 'none';
                    const idTitulo = new URLSearchParams(window.location.search).get('id');
                    if (typeof window.carregarEdicoes === 'function') window.carregarEdicoes(idTitulo, 0, 10, false);
                } else {
                    alert("Erro: " + result.mensagem);
                }
            } catch (error) { 
                console.error("Erro no update:", error); 
            }
        };
    }

    // --- CONFIRMAÇÃO DE DELEÇÃO ---
    if (btnConfirmDel) {
        btnConfirmDel.onclick = async function() {
            const id = this.getAttribute('data-id');
            const formData = new FormData();
            formData.append('id', id);

            try {
                const response = await fetch('php/api_delete_edition.php', { method: 'POST', body: formData });
                const result = await response.json();

                if (result.status === 'sucesso') {
                    document.getElementById('deleteConfirmModal').style.display = 'none';
                    const idTitulo = new URLSearchParams(window.location.search).get('id');
                    if (typeof window.carregarEdicoes === 'function') window.carregarEdicoes(idTitulo, 0, 10, false);
                } else {
                    alert(result.mensagem);
                }
            } catch (error) { 
                console.error("Erro na deleção:", error); 
            }
        };
    }

    // --- FECHAMENTO DE MODAIS ---
    document.querySelectorAll('.close-button, .btn-cancel, #cancelDeleteButton').forEach(btn => {
        btn.onclick = () => {
            document.getElementById('editModal').style.display = 'none';
            document.getElementById('deleteConfirmModal').style.display = 'none';
        };
    });

    // Função separada para remover o ouvinte sem problemas no cleanup
    function fecharMenusOpcoes() {
        document.querySelectorAll('.edition-menu-options').forEach(m => m.style.display = 'none');
    }
    document.addEventListener('click', fecharMenusOpcoes);
}