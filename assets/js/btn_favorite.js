{
    const API_PATH = '/hq_app/php/api_actions.php';

    window.toggleFavorito = async (tituloId, iconElement) => {
        if (!iconElement) return;

        const wasFavorite = iconElement.classList.contains('fas');

        try {
            iconElement.style.pointerEvents = 'none';

            const response = await fetch(API_PATH, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'toggle_favorito',
                    id_titulo: tituloId
                })
            });

            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
            const data = await response.json();

            if (data.status === 'sucesso') {
                if (wasFavorite) {
                    iconElement.classList.replace('fas', 'far');
                    iconElement.style.color = '#FCFCFC';
                    
                    // --- CORREÇÃO AQUI ---
                    // Verificamos se a URL atual contém "favorite"
                    const isFavoritesPage = window.location.pathname.includes('favorite');
                    
                    if (isFavoritesPage) {
                        const card = iconElement.closest('.card_lib');
                        if (card) {
                            // Adiciona uma transição suave antes de remover (opcional)
                            card.style.transition = 'opacity 0.3s ease';
                            card.style.opacity = '0';
                            setTimeout(() => {
                                card.remove();
                                
                                // Se após remover não sobrar nenhum card, podemos recarregar a lista
                                // ou mostrar a mensagem de "Nenhum favorito encontrado"
                                const container = document.querySelector('.container_cards_lib'); // ajuste para seu seletor real
                                if (container && container.children.length === 0) {
                                    if (typeof window.carregarListaTitulos === 'function') {
                                        window.carregarListaTitulos('mode=favorites', false);
                                    }
                                }
                            }, 300);
                        }
                    }
                } else {
                    iconElement.classList.replace('far', 'fas');
                    iconElement.style.color = '#F4D35E';
                }

                if (typeof window.carregarContadoresGerais === 'function') {
                    window.carregarContadoresGerais();
                }
            }
        } catch (error) {
            console.error("Erro na requisição de favorito:", error);
        } finally {
            iconElement.style.pointerEvents = 'auto';
        }
    };

    window.favoriteBtnCleanup = () => {
        delete window.toggleFavorito;
    };
}