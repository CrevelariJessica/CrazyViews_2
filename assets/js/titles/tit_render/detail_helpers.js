window.ReadDetailCtx = window.ReadDetailCtx || {};

window.ReadDetailCtx.convertToDBDate = function(mm_yyyy) {
    if (!mm_yyyy || mm_yyyy.length !== 7) return null;
    const [month, year] = mm_yyyy.split('/');
    return `${year}-${month}-01`;
};

window.ReadDetailCtx.convertToDisplayDate = function(yyyy_mm_dd) {
    if (!yyyy_mm_dd || yyyy_mm_dd.length < 7) return '';
    const parts = yyyy_mm_dd.split('-');
    return `${parts[1]}/${parts[0]}`; 
};

window.ReadDetailCtx.getUrlParameter = function(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};