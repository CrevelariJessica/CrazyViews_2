{
/**
 * Controlador da Página de Atualização de Títulos e Edições
 */

// Gestão de Cliques na Lista de Edições
var containerEdicoes = document.getElementById('EditionList');

// --- GESTÃO DE NOVA EDIÇÃO (EXPANSÍVEL) ---

const btnAddToggle = document.getElementById('button_addEdt');
const formContainer = document.getElementById('form_NewEdt');
const uploadForm = document.getElementById('uploadForm');
const feedback = document.getElementById('feedback_ajax');

if (btnAddToggle) {
    btnAddToggle.onclick = () => {
        // Alterna a classe 'is-open' que controla a animação no CSS
        formContainer.classList.toggle('is-open');

        // Se abriu, configura o ID do título
        if (formContainer.classList.contains('is-open')) {
            const idTitulo = new URLSearchParams(window.location.search).get('id');
            if (idTitulo) {
                document.querySelectorAll('input[name="id_titulo"]').forEach(el => el.value = idTitulo);
                console.log("ID do título configurado para upload:", idTitulo);
            }
        }
    };
}

// --- SUBMISSÃO AJAX ---

if (uploadForm) {
    uploadForm.onsubmit = async function(e) {
        e.preventDefault();

        // Limpa mensagens anteriores
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
                
                // Limpa o formulário e fecha
                uploadForm.reset();
                setTimeout(() => {
                    formContainer.style.display = 'none';
                    feedback.textContent = "";
                    // Recarrega a lista de edições
                    const idTitulo = new URLSearchParams(window.location.search).get('id');
                    carregarEdicoes(idTitulo, 0, 10, false);
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

if (containerEdicoes) {
    containerEdicoes.onclick = (e) => {
        const target = e.target;

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
            // Usa sua função do page_edition.js para formatar YYYY-MM-DD -> MM/AAAA
            document.getElementById('modalEditionDate').value = convertToDisplayDate(date);
            
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
            // window.carregarConteudo é sua função do global_scripts para SPA
            window.carregarConteudo(`templatePages.html?id_edicao=${id}`);
        }
    };
}

// 2. Submissão do Formulário de Edição
const formEdit = document.getElementById('editEditionForm');
if (formEdit) {
    formEdit.onsubmit = async function(e) {
        e.preventDefault();

        const dateInput = document.getElementById('modalEditionDate').value;
        if (!validateFormatDate(dateInput)) {
            alert("Data inválida! Use o formato MM/AAAA.");
            return;
        }

        const formData = new FormData(this);
        // Sobrescreve a data display pela data DB formatada (YYYY-MM-01)
        formData.set('data', convertToDBDate(dateInput));

        try {
            const response = await fetch('php/api_update_edition.php', { method: 'POST', body: formData });
            const result = await response.json();

            if (result.status === 'sucesso') {
                alert(result.mensagem);
                document.getElementById('editModal').style.display = 'none';
                const idTitulo = new URLSearchParams(window.location.search).get('id');
                carregarEdicoes(idTitulo, 0, 10, false);
            } else {
                alert("Erro: " + result.mensagem);
            }
        } catch (error) { console.error("Erro no update:", error); }
    };
}

// 3. Clique no Botão de Confirmação de Deleção
const btnConfirmDel = document.getElementById('confirmDeleteButton');
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
                carregarEdicoes(idTitulo, 0, 10, false);
            } else {
                alert(result.mensagem);
            }
        } catch (error) { console.error("Erro na deleção:", error); }
    };
}

// 4. Fechamento de Modais e Menus
document.querySelectorAll('.close-button, .btn-cancel, #cancelDeleteButton').forEach(btn => {
    btn.onclick = () => {
        document.getElementById('editModal').style.display = 'none';
        document.getElementById('deleteConfirmModal').style.display = 'none';
    };
});

document.addEventListener('click', () => {
    document.querySelectorAll('.edition-menu-options').forEach(m => m.style.display = 'none');
});
}