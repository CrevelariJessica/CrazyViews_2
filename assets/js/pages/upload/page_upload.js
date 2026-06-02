function validateYear() {
    const inputYear = document.getElementById('txt_ReleaseYe');
    const messageErro = document.getElementById('ErrorMensageYearRelease');
    
    //Limpar erros anteriores---------------------------------------------------
    inputYear.classList.remove('style_error');
    messageErro.style.display = 'none';
    messageErro.textContent = '';
    //--------------------------------------------------------------------------
    const yearEntered = parseInt(inputYear.value);
    const MINIMUM = 1920;
    const MAXIMUM = new Date().getFullYear();
    //verifica se o ano esta vazio/inválido-------------------------------------
    if(isNaN(yearEntered) || inputYear.value.trim() === ''){
        inputYear.classList.add('style_error');
        messageErro.textContent = `O campo não pode estar vazio.`;
        messageErro.style.display = 'block';
        inputYear.focus();
        return false;
    }
    // validação de limite------------------------------------------------------
    if (yearEntered < MINIMUM || yearEntered > MAXIMUM){
        //borda vermelha
        inputYear.classList.add('style_error');
        
        //mensagem vermelha
        messageErro.textContent = `Ano de lançamento inválido.`;
        messageErro.style.display = 'block';
        
        inputYear.focus();
        return false;
    }
    // retorno sucesso ---------------------------------------------------------
    return true;
}
//------------------------------------------------------------------------------
function maskNunberOnly(input, maxLength){
    let value = input.value;
    
    value = value.replace(/\D/g, ''); 
    
    if (value.length > maxLength){
        value = value.substring(0, maxLength);        
    }
    
    input.value = value;
}
//------------------------------------------------------------------------------
function validateinitialUploadForm() {
    const yearOk = validateYear();
    return yearOk;
}
//------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
        // Fecha TODAS as mensagens (as DIVs contêiner) ---
        function closeAllHelpMessages() {
            // Seleciona TODAS as DIVs que precisam ser escondidas
            const allContainers = document.querySelectorAll('.id_Cont_Help');
            
            allContainers.forEach(function(container) {
                // Remove a classe 'show-help' de todas as DIVs
                container.classList.remove('show-help');
            });
        }
        
        // O Ouvinte de Clique ---
        const botoesAjuda = document.querySelectorAll('.btn-help');

        botoesAjuda.forEach(function(botao) {
            botao.addEventListener('click', function() {

                // 1. Pega o ID do SPAN alvo
                const targetId = botao.getAttribute('data-target-id');
                const spanAlvo = document.getElementById(targetId);

                // 2. Encontra a DIV Contêiner (o elemento que tem a classe id_Cont_Help)
                const contemMensagem = spanAlvo.closest('.id_Cont_Help'); 

                // 3. Verifica se o contêiner JÁ está visível
                const isCurrentlyVisible = contemMensagem && contemMensagem.classList.contains('show-help');

                // 4. Fecha TODAS as mensagens abertas (Accordion)
                closeAllHelpMessages();

                // 5. Se a mensagem NÃO estava visível antes de fechar tudo, mostra o contêiner alvo
                if (!isCurrentlyVisible && contemMensagem) {
                    contemMensagem.classList.add('show-help');
                }
            });
        });
    });