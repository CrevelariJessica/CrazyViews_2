window.ReadDetailCtx = window.ReadDetailCtx || {};

window.ReadDetailCtx.showEditModal = function(editionId, currentNumber, currentDate) {
    const modal = document.getElementById('editModal');
    const displayDate = this.convertToDisplayDate(currentDate); 
    
    $('#modalEditionId').val(editionId);
    $('#modalEditionNumber').val(currentNumber);
    $('#modalEditionDate').val(displayDate);
    $('#editEditionForm').find('button[type="submit"]').text('Salvar Alterações').prop('disabled', false);
    
    modal.style.display = 'block';
};

window.ReadDetailCtx.showDeleteConfirmModal = function(editionId, editionNumber) {
    const modal = document.getElementById('deleteConfirmModal');
    const confirmButton = document.getElementById('confirmDeleteButton');

    $('#editionToDeleteInfo').text(`EDIÇÃO ${editionNumber || 'desconhecida'}`);
    confirmButton.setAttribute('data-id', editionId);
    modal.style.display = 'block';
};

window.ReadDetailCtx.validateEditModalForm = function() {
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
    
    // Chama a validação global de formato se existir
    if (typeof window.validateFormatDate === 'function') {
        if (!window.validateFormatDate(dataInput.value.trim())) { 
            dataInput.classList.add('style_error');
            alert('Formato de Data inválido. Use MM/AAAA.');
            isValid = false;
        }
    }

    return isValid;
};

window.ReadDetailCtx.toggleFormState = function(isOpen) {
    const formDiv = $('#form_NewEdt');
    const button = $('#button_addEdt');
    const transitionTime = 500; 

    if (isOpen) {
        formDiv.css('display', 'block');
        setTimeout(() => { formDiv.addClass('is-open'); }, 10); 
        button.text('Fechar Formulário');
    } else {
        formDiv.removeClass('is-open'); 
        setTimeout(() => {
            formDiv.css('display', 'none'); 
            if ($('#uploadForm').length) $('#uploadForm')[0].reset();
            $('#feedback_ajax').text('');
        }, transitionTime); 
        button.text('Adicionar Nova Edição');
    }
};