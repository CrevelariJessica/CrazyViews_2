// Gerencia as chamadas globais, unifica a validação do formulário de upload e expõe os fallbacks legado.

// Cria o Namespace Global se ele não existir
window.PageEditionCtx = window.PageEditionCtx || {};

// Expõe a validação mestre combinada para o escopo global (usada no submit do form)
window.validateUploadForm = function() {
    const ctx = window.PageEditionCtx;
    if (typeof ctx.validateEdition === 'function' && typeof ctx.validateDate === 'function') {
        const editionOk = ctx.validateEdition();
        const dateOk = ctx.validateDate();
        return editionOk && dateOk;
    }
    return true;
};

// Fallbacks de compatibilidade retroativa para funções soltas que possam ser chamadas em eventos inline (oninput, onblur)
window.maskDate = function(input) {
    if (typeof window.PageEditionCtx.maskDate === 'function') window.PageEditionCtx.maskDate(input);
};

window.maskNunberOnly = function(input, maxLength) {
    if (typeof window.PageEditionCtx.maskNunberOnly === 'function') window.PageEditionCtx.maskNunberOnly(input, maxLength);
};

window.validateEdition = function() {
    if (typeof window.PageEditionCtx.validateEdition === 'function') return window.PageEditionCtx.validateEdition();
    return true;
};

window.validateDate = function() {
    if (typeof window.PageEditionCtx.validateDate === 'function') return window.PageEditionCtx.validateDate();
    return true;
};