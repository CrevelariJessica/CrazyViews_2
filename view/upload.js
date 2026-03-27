{
    console.log("Iniciando Controlador: Upload");

    const SCRIPT_VALIDACAO = "page_upload.js"; 

    const loadScriptPromise = (src) => {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = `assets/js/${src}?v=${Date.now()}`;
            s.className = 'page-script';
            s.onload = resolve;
            s.onerror = () => reject(new Error(`Falha ao carregar: ${src}`));
            document.body.appendChild(s);
        });
    };

    const configurarFormulario = async () => {
        const form = document.getElementById('form-upload-hq');
        
        if (form) {
            console.log("Formulário encontrado. Vinculando submissão AJAX...");
            
            // Remove qualquer evento anterior para evitar duplicidade
            form.onsubmit = null; 

            form.onsubmit = async function(e) {
                // ESTA LINHA É A MAIS IMPORTANTE: impede o navegador de abrir o PHP diretamente
                e.preventDefault(); 
                e.stopPropagation();

                console.log("Submit interceptado com sucesso.");

                // Validação
                if (typeof window.validateinitialUploadForm === 'function') {
                    if (!window.validateinitialUploadForm()) return false;
                }

                const formData = new FormData(form);

                try {
                    const response = await fetch(form.action, {
                        method: 'POST',
                        body: formData
                    });

                    if (!response.ok) throw new Error("Erro na rede");

                    const result = await response.json();

                    if (result.success) {
                        const destino = `view/templateUpdate.html?id=${result.id}&novo=1`;
                        if (typeof window.carregarConteudo === 'function') {
                            window.carregarConteudo(destino);
                        } else {
                            window.location.href = `principal.html?page=templateUpdate&id=${result.id}`;
                        }
                    } else {
                        alert("Erro no PHP: " + result.error);
                    }
                } catch (error) {
                    console.error("Erro no Fetch:", error);
                    alert("Erro ao enviar dados. O servidor não respondeu com JSON válido.");
                }
                
                return false; // Garantia extra para não recarregar
            };
        } else {
            // Se o form ainda não existe (delay de renderização), tenta de novo em 100ms
            setTimeout(configurarFormulario, 100);
        }
    };

    const init = async () => {
        try {
            await loadScriptPromise(SCRIPT_VALIDACAO);
            await configurarFormulario();
            
            if (typeof window.initHelpButtons === 'function') {
                window.initHelpButtons();
            }
        } catch (err) {
            console.error("Erro no init:", err);
        }
    };

    init();
}