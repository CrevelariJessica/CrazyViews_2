const dadosEdicaoBanner = {
    id: null,
    edicao: null,
    paginas: []
};
function carregarDadosTitulo() {
    const urlParams = new URLSearchParams(window.location.search);
    const idTitulo = urlParams.get('id');

    if (!idTitulo) {
        console.error("ID do Título não encontrado na URL.");
        document.getElementById('info_basicas_titulo').innerHTML = '<p style="color: red;">ID do Título não fornecido.</p>';
        return;
    }

    const urlApi = '../php/api_title.php?id=' + idTitulo;

    fetch(urlApi)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro de rede ou servidor: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.error || !data.titulo) {
                    throw new Error(data.error || "Dados do título não encontrados no servidor.");
                }

                renderizarInformacoes(data);
                carregarDadosBanner(idTitulo);
                carregarEdicoes(idTitulo);
            })
            .catch(error => {
                console.error('Erro ao buscar ou renderizar dados:', error);
                document.getElementById('info_basicas_titulo').innerHTML = `<p style="color: red;">Erro: ${error.message}</p>`;
            });
}
function renderizarInformacoes(data) {
    const titulo = data.titulo;
    document.getElementById('tituloPrincipal').textContent = data.titulo;
    document.getElementById('tituloOriginal').textContent = data.original;
    document.getElementById('editoraNome').textContent = data.editora_nome;
    document.getElementById('generoNome').textContent = data.genero_nome;
    document.getElementById('anoLancamento').textContent = data.ano_lancamento;

    const idHidden = document.getElementById('id_titulo_geral');
    if (idHidden) {
        idHidden.value = data.id;
    }

    $('#id_titulo_hidden').val(data.id);
}
async function carregarEdicoes(idTitulo, offset, limite, anexar = false) { 
    if (!idTitulo) {
        console.error("ID do Título não fornecido para carregar edições.");
        return null;
    }

    const container = document.getElementById('EditionList');
    const loadMoreBtnContainer = document.getElementById('loadMoreContainer');
    
    if (!anexar) {
        container.innerHTML = '<li>Carregando edições...</li>'; 
        loadMoreBtnContainer.innerHTML = '';
    }

    try {
        const urlApiEd = `../php/api_editions.php?id=${idTitulo}&offset=${offset}&limite=${limite}`;        
        const response = await fetch(urlApiEd);
        
        if (!response.ok) {
            throw new Error(`Erro de rede ou servidor ao buscar edições: ${response.status}`);
        }
        
        const data = await response.json();

        if (data.status === 'sucesso' && Array.isArray(data.edicoes) && data.edicoes.length > 0) {
            
            if (!anexar) {
                container.innerHTML = ''; 
            }
            
            renderizarEdicoes(data.edicoes, anexar); 
            
            return data;

        } else if (data.status === 'sucesso' && data.edicoes.length === 0 && !anexar) {
            container.innerHTML = '<li>Nenhuma Edição Cadastrada.</li>';
            return data;
        } else if (data.status === 'sucesso' && data.edicoes.length === 0 && anexar) {
            return data; 
        } else {
            console.warn("Nenhuma edição encontrada ou erro do servidor.", data);
            loadMoreBtnContainer.innerHTML = 'Falha ao carregar mais.';
            return null;
        }

    } catch (error) {
        console.error('Erro ao buscar edições', error);
        if (!anexar) {
            container.innerHTML = `<p style="color: red;">Erro ao carregar edições: ${error.message}</p>`;
        } else {
             loadMoreBtnContainer.innerHTML = 'Falha ao carregar mais.';
        }
        return null;
    }
}
function renderizarEdicoes(edicoes, anexar = false){
    const container = document.getElementById('EditionList');
    
    let htmlContent = '';
    
    edicoes.forEach(edicao => {
        if(!edicao.id || !edicao.edicao){
            console.warn("Edição inválida ou incompleta encontrada, pulando renderização.", edicao);
            return;
        }
        const leituraUrl = `../view/read.html?id=${edicao.id}`;
        const capaUrl = edicao.caminho_capa_cb ? edicao.caminho_capa_cb : '../assets/img/placeholder.jpg';
        
        htmlContent += `
            <div class="cardEdition">
                <div class="edition-actions-container" data-edition-id="${edicao.id}">
                    <button class="btn-edition-menu">...</button>
                    
                    <div class="edition-menu-options" style="display: none;">
                        
                        <a href="#" 
                            class="menu-option btn-edit-all" 
                            data-id="${edicao.id}" 
                            data-numero="${edicao.edicao}" 
                            data-date="${edicao.data_lancamento}">
                            Editar Informações
                        </a>
                        
                        <a href="#" class="menu-option delete-action" data-id="${edicao.id}" data-numero="${edicao.edicao}">Deletar Edição</a>
                    </div>
                </div>
                
                <div class="cardImage"><img src="${capaUrl}" alt="Capa da Edição #${edicao.edicao}" style="width: 100%; height: 100%; object-fit: cover;"></div>
                    <div class="cardText">
                        <h3 class="cardTitle">Edição #${edicao.edicao}</h3>
                        <p class="cardDateP">Data da Edição: ${edicao.data_lancamento_formatada}</p>
                        <p class="cardDateP">${edicao.paginas} páginas</p>
                        <a href="${leituraUrl}" class="cardLink">Ler</a>
                    </div>
                </div>
            </div>
        `;
    });
    
    if (htmlContent) {
        if(anexar){
            container.insertAdjacentHTML('beforeend', htmlContent);
        } else {
            container.innerHTML = htmlContent;
        }
    }
}
async function carregarDadosBanner(idTitulo) {
    if (!idTitulo) return;
    
    const urlApi = `../php/api_banner.php?id=${idTitulo}`;
    const divBannerFundo = document.getElementById('bannerBackground');
    const imgBanner = document.getElementById('HQImage');

    try {
        const response = await fetch(urlApi);
        const data = await response.json();

        if (data.status === 'sucesso' && data.banner_data) {
            
            const bannerData = data.banner_data; 

            const listaPaginas = bannerData.paginas_string 
                ? bannerData.paginas_string.split(',').map(p => p.trim()).filter(p => p.length > 0)
                : [];
                
                dadosEdicaoBanner.id = data.banner_data.id_edicao;
                dadosEdicaoBanner.edicao = bannerData.edicao;
                dadosEdicaoBanner.paginas = listaPaginas;

            if (bannerData.caminho_capa && imgBanner) {
                imgBanner.style.display = 'flex';
                imgBanner.src = `../${bannerData.caminho_capa}`; 
            } else {
                imgBanner.style.display = 'none';
            }

            if (listaPaginas.length > 0 && divBannerFundo) {
                const pagAleatIndex = Math.floor(Math.random() * listaPaginas.length);
                const urlPagAleat = `../${listaPaginas[pagAleatIndex]}`;
                
                const randomX = Math.floor(Math.random() * 70) + 10;
                const randomY = Math.floor(Math.random() * 70) + 10;
                
                divBannerFundo.style.backgroundImage = `
                    linear-gradient(rgba(37, 110, 255, 0.4), rgba(37, 110, 225, 0.4)),
                    url('${urlPagAleat}')
                `;
                divBannerFundo.style.backgroundSize = 'cover';
                divBannerFundo.style.backgroundPosition = `${randomX}% ${randomY}%`;
                return;
            } else {
                console.warn("Edição encontrada, mas sem páginas válidas. Usando fallback.");
                if (imgBanner) imgBanner.style.display = 'none';
                if (divBannerFundo) divBannerFundo.style.backgroundColor = '#FCFCFC';
            }
        } else {
            console.error("Dados do banner não encontrados ou incompletos.");
            if (imgBanner) imgBanner.style.display = 'none';
            if (divBannerFundo) divBannerFundo.style.backgroundColor = '#FCFCFC';
        }

    }catch (error) {
        console.error('Erro ao buscar dados do banner (Rede/Parsing):', error);
        if (imgBanner) imgBanner.style.display = 'none';
        if (divBannerFundo) divBannerFundo.style.backgroundColor = '#FCFCFC';
    }
    
}
carregarDadosTitulo();