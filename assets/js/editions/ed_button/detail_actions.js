window.ReadDetailCtx = window.ReadDetailCtx || {};

window.ReadDetailCtx.deleteEdition = async function(editionId) {
    const formData = new FormData();
    formData.append('id', editionId);

    try {
        const response = await fetch('../php/api_delete_edition.php', {
            method: 'POST',
            body: formData 
        });

        if (!response.ok) throw new Error(`Erro de rede: ${response.status}`);
        const data = await response.json();

        if (data.status === 'sucesso') {
            alert(data.mensagem);
            this.gerenciarCarregamentoEdicoes(false);
        } else {
            alert("Falha ao deletar: " + data.mensagem);
        }
    } catch (error) {
        console.error("Erro no AJAX de deleção:", error);
        alert(`Erro ao comunicar com o servidor: ${error.message}`);
    }
};

window.ReadDetailCtx.updateEditionData = async function(editionId, novoNumero, novaDataBD) {
    const formData = new FormData();
    formData.append('id', editionId);
    formData.append('numero', novoNumero);
    formData.append('data', novaDataBD);
    
    try {
        const response = await fetch('../php/api_update_edition.php', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error(`Erro de rede: ${response.status}`);
        const data = await response.json();
        
        if (data.status === 'sucesso') {
            return { success: true, message: data.mensagem || "Edição updated!" };
        } else {
            return { success: false, message: data.mensagem };
        }
    } catch (error) {
        console.error("Erro no AJAX de atualização:", error);
        return { success: false, message: error.message };
    }
};

window.ReadDetailCtx.loadPageData = function(id) {
    const ctx = this;
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
                var novoTitulo = ano_lancamento ? nome_titulo + ' (' + ano_lancamento + ')' : nome_titulo;
                document.title = novoTitulo;
                
                var detalhes_html = '<h1>' + titulo.titulo + '</h1>' + '<div>Editora: ' + titulo.editora + '</div>';
                
                $('#titulo_detalhes').html(detalhes_html);
                $('#pageTitle').text('Nome da HQ Enviada - ' + titulo.titulo);
                
                ctx.gerenciarCarregamentoEdicoes(false);
            } else {
                $('#erro_inicial').text('Erro ao carregar dados: ' + response.mensagem).show();
            }
        },
        error: function() {
            $('#erro_inicial').text('Falha na comunicação com o servidor.').show();
        }
    });
};

window.ReadDetailCtx.handleUploadSubmit = function(formElement, e) {
    e.preventDefault(); 
    const ctx = this;
    const feedback = $('#feedback_ajax');

    if (typeof window.validateUploadForm === 'function' && !window.validateUploadForm()) {
        feedback.html('<span style="color: red;">Corrija os erros do formulário.</span>');
        return false; 
    }

    feedback.text('Enviando e processando...').css('color', 'orange');
    const formData = new FormData(formElement);

    $.ajax({
        url: $(formElement).attr('action'),
        type: 'POST',
        data: formData,
        dataType: 'json',
        processData: false,
        contentType: false,
        success: function(response) {
            if (response.status === 'sucesso') {
                feedback.text('Edição cadastrada com sucesso!').css('color', 'green');
                setTimeout(() => {
                    ctx.gerenciarCarregamentoEdicoes(false);
                    ctx.toggleFormState(false);
                }, 1500);
            } else {
                feedback.html('<span style="color: red;">ERRO: ' + response.mensagem + '</span>');
            }
        },
        error: function() {
            feedback.html('<span style="color: red;">Falha na comunicação com o servidor.</span>');
        }
    });
};

window.ReadDetailCtx.handleEditSubmit = async function(formElement, e) {
    e.preventDefault();
    const ctx = this;

    if (!ctx.validateEditModalForm()) return;
    
    const editionId = $('#modalEditionId').val();
    const novoNumero = $('#modalEditionNumber').val();
    const dataDigitadaMMYYYY = $('#modalEditionDate').val();
    const novaDataBD = ctx.convertToDBDate(dataDigitadaMMYYYY);

    $(formElement).find('button[type="submit"]').text('Salvando...').prop('disabled', true);
    
    const result = await ctx.updateEditionData(editionId, novoNumero, novaDataBD); 

    if (result.success) {
        alert(result.message);
        $('#editModal').hide();
        ctx.gerenciarCarregamentoEdicoes(false);
    } else {
        alert("ERRO: " + result.message);
        $(formElement).find('button[type="submit"]').text('Salvar Alterações').prop('disabled', false);
    }
};