const FAVORITES_API_PATH = '../php/api_actions.php'; 

async function toggleFavorito(tituloId, iconElement) {
    const wasFavorite = iconElement.classList.contains('fas'); 

    try {
        iconElement.style.pointerEvents = 'none'; 
        
        const response = await fetch(FAVORITES_API_PATH, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'toggle_favorito', id_titulo: tituloId })
        });
        
        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status} ao alternar favorito.`);
        }

        const data = await response.json();

        if (data.status === 'sucesso') {
            const isFavoritesPage = window.location.pathname.includes('favorite.html');
            let shouldReactivatePointer = true; 
            
            const finalOperation = wasFavorite ? 'deleted' : 'inserted';
            
            if (finalOperation === 'inserted') {
                iconElement.classList.remove('far');
                iconElement.classList.add('fas');
                iconElement.style.color = '#F4D35E'; 
            } else if (finalOperation === 'deleted') {
                iconElement.classList.remove('fas');
                iconElement.classList.add('far');
                iconElement.style.color = '#FCFCFC'; 
            }
            
            if (typeof window.carregarContadoresGerais === 'function') {
                window.carregarContadoresGerais();
            }
            
            if (isFavoritesPage && finalOperation === 'deleted') {
                if (typeof window.carregarListaTitulos === 'function') {
                    console.log("[FAVORITOS] Remoção detectada. Chamada de recarga da lista disparada.");
                    window.carregarListaTitulos('mode=favorites', false); 
                } else {
                    console.error("[ERRO FATAL] Função carregarListaTitulos não está definida globalmente.");
                }
                shouldReactivatePointer = false;
            } 
            if (shouldReactivatePointer) {
                iconElement.style.pointerEvents = 'auto'; 
            }

        } else {
            console.error('Erro ao alternar favorito:', data.mensagem || 'Resposta da API indicou falha no status.');
            iconElement.style.pointerEvents = 'auto'; 
        }

    } catch (error) {
        console.error('Falha na comunicação com a API (Toggle Favorito):', error);
        iconElement.style.pointerEvents = 'auto'; 
    }
}
window.toggleFavorito = toggleFavorito;