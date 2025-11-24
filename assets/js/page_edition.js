function validateFormatDate(dataString) {
    if (!/^\d{2}\/\d{4}$/.test(dataString)) {
        return false;
    }

    const [monthStr, yearStr] = dataString.split('/');
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    // --- Verificações ---
    if (month < 1 || month > 12) return false;
    if (year > currentYear) return false;
    if (year === currentYear && month > currentMonth) return false;
    if (year < 1920) return false;

    return true;
}
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

function validateDate() {
    const inputDate = document.getElementById('txt_ReleaseDate');
    const errorDate = document.getElementById('ErrorDate');
    if (!inputDate || !errorDate) return true;

    inputDate.classList.remove('style_error');
    errorDate.style.display = 'none';

    const dateValue = inputDate.value.trim();

    const isValid = validateFormatDate(dateValue);

    if (!isValid) {
        inputDate.classList.add('style_error');
        errorDate.textContent = 'Data inválida. Verifique mês/ano.';
        errorDate.style.display = 'block';
        inputDate.focus();
        return false;
    }

    return true;
}
function maskDate(input){
    let value = input.value;
    
    value = value.replace(/\D/g, '');
    value = value.substring(0, 6);
    
    if (value.length > 2){
        value = value.replace(/^(\d{2})/, '$1/');        
    }
    input.value = value;
}
function maskNunberOnly(input, maxLength){
    let value = input.value;
    
    value = value.replace(/\D/g, ''); 
    
    if (value.length > maxLength){
        value = value.substring(0, maxLength);        
    }
    
    input.value = value;
}
function validateEdition(event) {
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
}
function validateUploadForm() {
    const editionOk = validateEdition();
    const dateOk = validateDate();
    return editionOk && dateOk;
}