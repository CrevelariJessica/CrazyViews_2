//Controla a digitação em tempo real do usuário, como travar números e enfiar a barra / de data.

window.PageEditionCtx = window.PageEditionCtx || {};

window.PageEditionCtx.maskDate = function(input) {
    let value = input.value;
    
    value = value.replace(/\D/g, '');
    value = value.substring(0, 6);
    
    if (value.length > 2){
        value = value.replace(/^(\d{2})/, '$1/');        
    }
    input.value = value;
};

window.PageEditionCtx.maskNunberOnly = function(input, maxLength) {
    let value = input.value;
    
    value = value.replace(/\D/g, ''); 
    
    if (value.length > maxLength){
        value = value.substring(0, maxLength);        
    }
    
    input.value = value;
};