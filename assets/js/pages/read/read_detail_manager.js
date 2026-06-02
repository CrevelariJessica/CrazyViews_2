// Cria o Namespace Global se ele ainda não existir
window.ReadDetailCtx = window.ReadDetailCtx || {
    // Estado Compartilhado da Página
    container: null,
    offsetAtual: 0,
    limitePorCarga: 10,
    todasEdicoesCarregadas: false,
    titulo_id: null
};

$(document).ready(function() {
    // Inicializa o container e pega o ID da URL
    window.ReadDetailCtx.container = document.getElementById('EditionList');
    if (typeof window.ReadDetailCtx.getUrlParameter === 'function') {
        window.ReadDetailCtx.titulo_id = window.ReadDetailCtx.getUrlParameter('id');
    }

    const ctx = window.ReadDetailCtx;

    if (!ctx.titulo_id) {
        $('#erro_inicial').text('ID de título não fornecido ou inválido.').show();
        return;
    }
    
    $('#id_titulo_hidden').val(ctx.titulo_id);
    
    // Verifica se houve redirecionamento com mensagem de sucesso
    var sucesso_msg = ctx.getUrlParameter('success'); 
    if (sucesso_msg === '1') {
        $('#sucesso_feedback').text('Nova edição adicionada com sucesso!').show();
        if (history.replaceState) {
            var cleanUrl = window.location.href.split('?')[0] + '?id=' + ctx.titulo_id;
            history.replaceState(null, null, cleanUrl);
        }
    }

    // --- ASSINATURA DOS EVENTOS ---
    $('#button_addEdt').on('click', function(){ 
        if (typeof ctx.toggleFormState === 'function') {
            const novoEstado = !$('#form_NewEdt').hasClass('is-open');
            ctx.toggleFormState(novoEstado);
        }
    });
    
    $('#uploadForm').on('submit', function(e) {
        if (typeof ctx.handleUploadSubmit === 'function') {
            ctx.handleUploadSubmit(this, e);
        }
    });

    $('#editEditionForm').on('submit', function(e) {
        if (typeof ctx.handleEditSubmit === 'function') {
            ctx.handleEditSubmit(this, e);
        }
    });

    // Menus e Modais Dinâmicos
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
        if (typeof ctx.showDeleteConfirmModal === 'function') {
            ctx.showDeleteConfirmModal($(this).data('id'), $(this).data('numero'));
        }
    });

    $(document).on('click', '.btn-edit-all', function(e) {
        e.preventDefault();
        if (typeof ctx.showEditModal === 'function') {
            ctx.showEditModal($(this).data('id'), $(this).data('numero'), $(this).data('date'));
        }
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
        if (editionId && typeof ctx.deleteEdition === 'function') {
            ctx.deleteEdition(editionId);
        } else if (!editionId) {
            alert("Erro: ID da edição não encontrado para deleção.");
        }
    });

    // Disparada Inicial
    if (typeof ctx.loadPageData === 'function') {
        ctx.loadPageData(ctx.titulo_id);
    }
});