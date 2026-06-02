window.ReadDetailCtx = window.ReadDetailCtx || {};

window.ReadDetailCtx.gerenciarCarregamentoEdicoes = async function(anexar = false) {
    const ctx = this;
    if (!anexar) {
        ctx.offsetAtual = 0;
        ctx.todasEdicoesCarregadas = false;
        if (ctx.container) ctx.container.innerHTML = '';
    }

    if (ctx.todasEdicoesCarregadas) {
        $('#loadMoreContainer').text('Todas as edições foram carregadas.');
        return;
    }

    if (typeof window.carregarEdicoes === 'function') {
        const data = await window.carregarEdicoes(ctx.titulo_id, ctx.offsetAtual, ctx.limitePorCarga, anexar);

        if (data) {
            const totalCarregado = data.total_carregado;
            ctx.offsetAtual += totalCarregado;

            if (totalCarregado < ctx.limitePorCarga) {
                ctx.todasEdicoesCarregadas = true;
                $('#loadMoreContainer').html('<span class="text-muted">Fim da lista.</span>');
            } else {
                ctx.renderizarBotaoCarregarMais();
            }
        }
    }
};

window.ReadDetailCtx.renderizarBotaoCarregarMais = function() {
    const ctx = this;
    $('#loadMoreContainer').html('<button id="btnLoadMore" class="btn btn-secondary">CARREGAR + ' + (ctx.limitePorCarga) + '</button>');

    $('#btnLoadMore').off('click').on('click', function() {
        $(this).text('Carregando...').prop('disabled', true);
        ctx.gerenciarCarregamentoEdicoes(true);
    });
};