//Faz a checagem visual de erro, injeta classes CSS de erro e exibe as mensagens nas tags pequenas.

window.PageEditionCtx = window.PageEditionCtx || {};

window.PageEditionCtx.validateDate = function() {
    const ctx = window.PageEditionCtx;
    const inputDate = document.getElementById('txt_ReleaseDate');
    const errorDate = document.getElementById('ErrorDate');
    if (!inputDate || !errorDate) return true;

    inputDate.classList.remove('style_error');
    errorDate.style.display = 'none';

    const dateValue = inputDate.value.trim();

    // Usa a validação lógica que foi isolada no date_helpers
    const isValid = typeof ctx.validateFormatDate === 'function' ? ctx.validateFormatDate(dateValue) : true;

    if (!isValid) {
        inputDate.classList.add('style_error');
        errorDate.textContent = 'Data inválida. Verifique mês/ano.';
        errorDate.style.display = 'block';
        inputDate.focus();
        return false;
    }

    return true;
};

window.PageEditionCtx.validateEdition = function() {
    const inputEdition = document.getElementById('txt_Edition');
    const errorEdition = document.getElementById('errorEdition');
    
    if (!inputEdition || !errorEdition) {
        return true; 
    }
    
    const MINIMUM = 1;
    const MAXIMUM = 59499;
    
    inputEdition.classList.remove('style_error');
    errorEdition.style.display = 'none';
    errorEdition.textContent = '';
    
    const editionEntered = parseInt(inputEdition.value, 10);
    
    if (isNaN(editionEntered) || inputEdition.value.trim() === '') {
        return false; 
    }

    if (editionEntered < MINIMUM || editionEntered > MAXIMUM) {
        const customMessage = `O número da edição deve ser um valor válido (Ex: 1, 12, 500).`;
        
        inputEdition.classList.add('style_error');
        errorEdition.textContent = customMessage;
        errorEdition.style.display = 'block';
        inputEdition.focus();
        
        return false;
    }    
    return true;
};