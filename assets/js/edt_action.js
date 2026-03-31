/**
 * Gestão de Interações e Ações das Edições (Eliminar, Editar, Menus)
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // Lógica para abrir/fechar o menu de opções
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-edition-menu')) {
            const menu = e.target.nextElementSibling;
            
            // Fecha outros menus que possam estar abertos
            document.querySelectorAll('.edition-menu-options').forEach(m => {
                if (m !== menu) m.style.display = 'none';
            });

            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
            e.stopPropagation();
        } else {
            // Se clicar fora, fecha todos os menus
            document.querySelectorAll('.edition-menu-options').forEach(m => m.style.display = 'none');
        }
    });

    // Lógica para ELIMINAR EDIÇÃO
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-action')) {
            e.preventDefault();

            const idEdicao = e.target.getAttribute('data-id');
            const numeroEdicao = e.target.getAttribute('data-numero');

            if (confirm(`Tem a certeza que deseja eliminar a Edição #${numeroEdicao}?`)) {
                try {
                    const formData = new FormData();
                    formData.append('id', idEdicao);

                    const response = await fetch('php/api_delete_edition.php', {
                        method: 'POST',
                        body: formData
                    });

                    const result = await response.json();

                    if (result.status === 'sucesso') {
                        alert(result.mensagem);
                        // Chama a função global que está no api_t.js para recarregar a lista
                        const idTitulo = new URLSearchParams(window.location.search).get('id');
                        if (typeof carregarEdicoes === 'function') {
                            carregarEdicoes(idTitulo, 0, 10, false);
                        }
                    } else {
                        alert("Erro: " + result.mensagem);
                    }
                } catch (error) {
                    console.error("Erro ao eliminar:", error);
                    alert("Erro na comunicação com o servidor.");
                }
            }
        }
    });

    // Lógica para EDITAR INFORMAÇÕES (Abrir formulário)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-edit-all')) {
            e.preventDefault();

            const data = {
                id: e.target.getAttribute('data-id'),
                numero: e.target.getAttribute('data-numero'),
                data: e.target.getAttribute('data-date')
            };

            // Procura os campos no teu templateUpdate.html
            const campoId = document.getElementById('edit_id_edicao');
            const campoNumero = document.getElementById('edit_numero_edicao');
            const campoData = document.getElementById('edit_data_edicao');
            const formContainer = document.getElementById('form_EditEdt_Container'); // Exemplo de ID do container do form

            if (campoId && campoNumero) {
                campoId.value = data.id;
                campoNumero.value = data.numero;
                if(campoData) campoData.value = data.data;
                
                if(formContainer) {
                    formContainer.style.display = 'block';
                    formContainer.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
    });
});