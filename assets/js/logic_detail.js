const container = document.getElementById('EditionList');
var offsetAtual = 0;
const limitePorCarga = 10;
var todasEdicoesCarregadas = false;
const titulo_id = getUrlParameter('id');

function convertToDBDate(mm_yyyy) {
    if (!mm_yyyy || mm_yyyy.length !== 7) return null;
    const [month, year] = mm_yyyy.split('/');
    return `${year}-${month}-01`;
}
function convertToDisplayDate(yyyy_mm_dd) {
    if (!yyyy_mm_dd || yyyy_mm_dd.length < 7) return '';
    const parts = yyyy_mm_dd.split('-');
    return `${parts[1]}/${parts[0]}`; 
}
function showEditModal(editionId, currentNumber, currentDate) {
    const modal = document.getElementById('editModal');
    const displayDate = convertToDisplayDate(currentDate); 
    
    $('#modalEditionId').val(editionId);
    $('#modalEditionNumber').val(currentNumber);
    $('#modalEditionDate').val(displayDate);
    $('#editEditionForm').find('button[type="submit"]').text('Salvar Alterações').prop('disabled', false);
    
    modal.style.display = 'block';
}
function showDeleteConfirmModal(editionId, editionNumber) {
    const modal = document.getElementById('deleteConfirmModal');
    const confirmButton = document.getElementById('confirmDeleteButton');

    $('#editionToDeleteInfo').text(`EDIÇÃO ${editionNumber}`);
    confirmButton.setAttribute('data-id', editionId);
    modal.style.display = 'block';
}
function validateEditModalForm() {
    const numeroInput = document.getElementById('modalEditionNumber');
    const dataInput = document.getElementById('modalEditionDate');
    let isValid = true;
    
    numeroInput.classList.remove('style_error');
    dataInput.classList.remove('style_error');

    const numeroValido = !isNaN(parseInt(numeroInput.value)) && parseInt(numeroInput.value) > 0 && parseInt(numeroInput.value) <= 59499;
    if (!numeroValido) {
        numeroInput.classList.add('style_error');
        alert('Número da Edição inválido.');
        isValid = false;
    }
    
    if (!validateFormatDate(dataInput.value.trim())) { 
        dataInput.classList.add('style_error');
        alert('Formato de Data inválido. Use MM/AAAA.');
        isValid = false;
    }

    return isValid;
}
async function deleteEdition(editionId) {
    const formData = new FormData();
    formData.append('id', editionId);

    try {
        
        const response = await fetch('../php/api_delete_edition.php', {
            method: 'POST',
            body: formData 
        });

        if (!response.ok) {
            throw new Error(`Erro de rede: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'sucesso') {
            alert(data.mensagem);
            gerenciarCarregamentoEdicoes(false);
        } else {
            alert("Falha ao deletar: " + data.mensagem);
        }

    } catch (error) {
        console.error("Erro no AJAX de deleção:", error);
        alert(`Erro ao comunicar com o servidor: ${error.message}`);
    }
}
async function updateEditionData(editionId, novoNumero, novaDataBD) {
    const formData = new FormData();
    formData.append('id', editionId);
    formData.append('numero', novoNumero);
    formData.append('data', novaDataBD);
    
    let data;
    try {
        const response = await fetch('../php/api_update_edition.php', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Erro de rede: ${response.status}`);
        }
        
        data = await response.json();
        
        if (data.status === 'sucesso') {
            return { success: true, message: data.mensagem || "Edição atualizada com sucesso!" };
        } else {
            return { success: false, message: data.mensagem || "Falha ao atualizar a edição." };
        }

    } catch (error) {
        console.error("Erro no AJAX de atualização:", error);
        return { success: false, message: `Erro ao comunicar com o servidor: ${error.message}` };
    }
}
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}
async function gerenciarCarregamentoEdicoes(anexar = false) {
    if (!anexar) {
        offsetAtual = 0;
        todasEdicoesCarregadas = false;
        if(container) container.innerHTML = '';
    }

    if (todasEdicoesCarregadas) {
        $('#loadMoreContainer').text('Todas as edições foram carregadas.');
        return;
    }

    const data = await carregarEdicoes(titulo_id, offsetAtual, limitePorCarga, anexar);

    if (data) {
        const totalCarregado = data.total_carregado;
        offsetAtual += totalCarregado;

        if (totalCarregado < limitePorCarga) {
            todasEdicoesCarregadas = true;
            $('#loadMoreContainer').html('<span class="text-muted">Fim da lista.</span>');
        } else {
            renderizarBotaoCarregarMais();
        }
    }
}
function renderizarBotaoCarregarMais() {
    $('#loadMoreContainer').html('<button id="btnLoadMore" class="btn btn-secondary">CARREGAR + ' + (limitePorCarga) + '</button>');

    $('#btnLoadMore').off('click').on('click', function() {
        $(this).text('Carregando...').prop('disabled', true);
        gerenciarCarregamentoEdicoes(true);
    });
}
$(document).ready(function() {
    if (!titulo_id) {
        $('#erro_inicial').text('ID de título não fornecido ou inválido.').show();
        return;
    }
    
    $('#id_titulo_hidden').val(titulo_id);
    
    function loadPageData(id) {
        $('#erro_inicial').hide();
        $.ajax({
            url: '../php/api_details.php', 
            type: 'GET',
            data: { id: id },
            dataType: 'json',
            success: function(response) {
                if (response.status === 'sucesso') {
                    $('#erro_inicial').hide();
                    var titulo = response.titulo;
                    var nome_titulo = titulo.titulo || '';
                    var ano_lancamento = '';
                    
                    if (titulo.ano_lancamento && titulo.ano_lancamento.length >= 4) {
                        ano_lancamento = titulo.data_lancamento.substring(0, 4);
                    }
                    var novoTitulo;
                    if (ano_lancamento) {
                        novoTitulo = nome_titulo + ' (' + ano_lancamento + ')';
                    } else {
                        novoTitulo = nome_titulo;
                    }
                    document.title = novoTitulo;
                    
                    var detalhes_html = 
                        '<h1>' + titulo.titulo + '</h1>' + 
                        '<div>Editora: ' + titulo.editora + '</div>';
                    
                    $('#titulo_detalhes').html(detalhes_html);
                    $('#pageTitle').text('Nome da HQ Enviada - ' + titulo.titulo);
                    
                    gerenciarCarregamentoEdicoes(false);
                    
                } else {
                    $('#erro_inicial').text('Erro ao carregar dados: ' + response.mensagem).show();
                }
            },
            error: function() {
                $('#erro_inicial').text('Falha na comunicação com o servidor.').show();
            }
        });
    }

    function toggleFormState(isOpen) {
        const formDiv = $('#form_NewEdt');
        const button = $('#button_addEdt');
        const transitionTime = 500; 

        if (isOpen) {
            formDiv.css('display', 'block');
            setTimeout(() => {
                formDiv.addClass('is-open'); 
            }, 10); 
            button.text('Fechar Formulário');
        } else {
            formDiv.removeClass('is-open'); 
            setTimeout(() => {
                formDiv.css('display', 'none'); 
                $(`#uploadForm`)[0].reset();
                $('#feedback_ajax').text('');
            }, transitionTime); 
            button.text('Adicionar Nova Edição');
        }
    }

    var sucesso_msg = getUrlParameter('success'); 
    if (sucesso_msg === '1') {
        $('#sucesso_feedback').text('Nova edição adicionada com sucesso!').show();
        if (history.replaceState) {
            var cleanUrl = window.location.href.split('?')[0] + '?id=' + titulo_id;
            history.replaceState(null, null, cleanUrl);
        }
    }

    $('#button_addEdt').on('click', function(){ 
        const novoEstado = !$('#form_NewEdt').hasClass('is-open');
        toggleFormState(novoEstado);
    });
    
    $('#uploadForm').on('submit', function(e) {
        e.preventDefault(); 
        const feedback = $('#feedback_ajax');

        const isValid = validateUploadForm();

        if (!isValid) {
            feedback.html('<span style="color: red;">Corrija os erros do formulário.</span>');
            return false; 
        }

        feedback.text('Enviando e processando...').css('color', 'orange');

        const formData = new FormData(this);
        $.ajax({
            url: $(this).attr('action'),
            type: 'POST',
            data: formData,
            dataType: 'json',
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.status === 'sucesso') {
                    feedback.text('Edição cadastrada com sucesso!').css('color', 'green');
                    setTimeout(() => {
                        gerenciarCarregamentoEdicoes(false);
                        toggleFormState(false);
                    }, 1500);
                } else {
                    feedback.html('<span style="color: red;">ERRO: ' + response.mensagem + '</span>');
                }
            },
            error: function() {
                feedback.html('<span style="color: red;">Falha na comunicação com o servidor.</span>');
            }
        });
        return false;
    });
    $(document).on('click', '.btn-edition-menu', function() {
        const menu = $(this).siblings('.edition-menu-options');
        $('.edition-menu-options').not(menu).hide();
        menu.slideToggle(200); 
    });

    $(document).on('click', function(e) {
        if (!$(e.target).closest('.edition-actions-container').length) {
            $('.edition-menu-options').hide();
        }
    });

    $(document).on('click', '.delete-action', function(e) {
        e.preventDefault();
        $('.edition-menu-options').hide();	
        const editionId = $(this).data('id');
        const editionNumber = $(this).data('numero');

        showDeleteConfirmModal(editionId, editionNumber || 'desconhecida'); 
    });

    $(document).on('click', '.btn-edit-all', function(e) {
        e.preventDefault();
        
        const id = $(this).data('id');
        const numero = $(this).data('numero');
        const dataOriginal = $(this).data('date');
        
        showEditModal(id, numero, dataOriginal); 
    });

    $(document).on('click', '#closeModal', function() {
        $('#editModal').hide();
    });

    $(document).on('click', '#closeDeleteModal, #cancelDeleteButton', function() {
        $('#deleteConfirmModal').hide();
    });
    
    $(document).on('click', '#confirmDeleteButton', function() {
        const editionId = $(this).data('id');

        $('#deleteConfirmModal').hide(); 

        if (editionId) {
            deleteEdition(editionId);
        } else {
            alert("Erro: ID da edição não encontrado para deleção.");
        }
    });
    
    $('#editEditionForm').on('submit', async function(e) {
        e.preventDefault();

        if (!validateEditModalForm()) {
            return;
        }
        
        const editionId = $('#modalEditionId').val();
        const novoNumero = $('#modalEditionNumber').val();
        const dataDigitadaMMYYYY = $('#modalEditionDate').val();
        const novaDataBD = convertToDBDate(dataDigitadaMMYYYY);

        $(this).find('button[type="submit"]').text('Salvando...').prop('disabled', true);
        
        const result = await updateEditionData(editionId, novoNumero, novaDataBD); 

        if (result.success) {
            alert(result.message);
            $('#editModal').hide();
            gerenciarCarregamentoEdicoes(false);
        } else {
            alert("ERRO: " + result.message);
            $(this).find('button[type="submit"]').text('Salvar Alterações').prop('disabled', false);
        }
    });
    loadPageData(titulo_id);
});