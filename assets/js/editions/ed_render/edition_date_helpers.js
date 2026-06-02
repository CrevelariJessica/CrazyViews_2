// Cuida de validações de regras de negócio de datas e conversão para o banco.

window.PageEditionCtx = window.PageEditionCtx || {};

window.PageEditionCtx.validateFormatDate = function(dataString) {
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
};

window.PageEditionCtx.convertToDBDate = function(mm_yyyy) {
    if (!mm_yyyy || mm_yyyy.length !== 7) return null;
    const [month, year] = mm_yyyy.split('/');
    return `${year}-${month}-01`;
};

window.PageEditionCtx.convertToDisplayDate = function(yyyy_mm_dd) {
    if (!yyyy_mm_dd || yyyy_mm_dd.length < 7) return '';
    const parts = yyyy_mm_dd.split('-');
    return `${parts[1]}/${parts[0]}`; 
};