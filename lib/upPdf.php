<?php
function processar_pdf($conn, $id_edicao, $edicao_numero, $file_data_array, $diretorio_destino, $pasta_titulo) {
    
    $paginas_processadas = 0;
    $sql_paginas_batch = '';
    $upload_sucesso = true;
    $erro_mensagem = '';
    
    $arquivo_temporario = $file_data_array['tmp_name'][0];
    
    // ----------------------------------------------------------------------
    // Validação de Arquivo e Setup Imagick
    // Verificação de upload legítimo
    if (!is_uploaded_file($arquivo_temporario)) {
         return[
            'sucesso' => false,
            'sql' => '',
            'paginas' => 0,
            'erro' => "Erro de segurança: O arquivo não é um upload legítimo ou o array de dados está incorreto."
        ];
    }
    
    if (!extension_loaded('imagick')){
        return[
            'sucesso' => false,
            'sql' => '',
            'paginas' => 0,
            'erro' => "Erro: A extensão Imagick não está instalada no servidor. Não é possível processar PDF."
        ];
    }
    
    try {
        $imagick = new Imagick();
        
        // Define a resolução ANTES de ler o PDF. 
        // 300x300 é um bom padrão para alta qualidade.
        $imagick->setResolution(600, 600);
        
        // abre o pdf
        $imagick->readImage($arquivo_temporario);
        
        $total_paginas = $imagick->getNumberImages();
        
        if ($total_paginas === 0){
            throw new Exception("O arquivo PDF não contém páginas válidas.");
        }
        
        //----------------------------------------------------------------------
        //Itera sobre cada página do pdf
        for ($i = 0; $i < $total_paginas; $i++) {
            
            // Garante que estamos na página correta do objeto Imagick
            $imagick->setIteratorIndex($i); 
            $pagina_imagick = $imagick->current(); // Pega a imagem na posição atual
            
            $pagina_imagick->resizeImage(1600, 0, Imagick::FILTER_LANCZOS, 1); //1.0 é o fator de desfoque, 1.0 (ou 0.9) para nitidez.
            
            // define formato de saída/ JPG costuma ser melhor para hq
            $pagina_imagick->setImageFormat('jpeg');
            
            // otimização e qualidade
            $pagina_imagick->setCompression(Imagick::COMPRESSION_JPEG);
            $pagina_imagick->setCompressionQuality(95);
            
            $pagina_num = $paginas_processadas + 1;
            $nome_final = sprintf("pagina_%03d.jpg", $pagina_num); //formato fixo
            
            $caminho_final_servidor = $diretorio_destino . $nome_final;
            $caminho_db = "files/{$pasta_titulo}/edicao_{$edicao_numero}/{$nome_final}";
            
            //------------------------------------------------------------------
            //salva a imagem da página
            if(!$pagina_imagick->writeImage($caminho_final_servidor)){
                $upload_sucesso = false;
                throw new Exception("Falha ao salvar a imagem da página {$pagina_num}.");
            }
            
            //------------------------------------------------------------------
            //Monta o sql para multi_query
            $caminho_db_esc = $conn->real_escape_string($caminho_db);
            $sql_paginas_batch .= "INSERT INTO paginas (id_edicao, pagina, arquivo)  
                                   VALUES ({$id_edicao}, {$pagina_num}, '{$caminho_db_esc}');";
            
            $paginas_processadas++;
            // Não precisa mais do $pagina_imagick->destroy() aqui, pois o setIteratorIndex e current() são mais estáveis.
        }
        
        //----------------------------------------------------------------------
        //Limpar a memória do Imagick
        $imagick->clear();
        $imagick->destroy();
        
    } catch (Exception $ex) {
        $upload_sucesso = false;
        $erro_mensagem = "Erro ao processar PDF com Imagick: " . $ex->getMessage();
        error_log($erro_mensagem);
        
        // NOVO: Tenta limpar se a exceção ocorrer *após* a inicialização
        if (isset($imagick)) {
            $imagick->clear();
            $imagick->destroy();
        }
    }
    //--------------------------------------------------------------------------
    //Retorno final
    if (!$upload_sucesso || $paginas_processadas === 0){
        $erro_mensagem = $erro_mensagem ?: "Não foi possível extrair nenhuma página do PDF.";
        
        return [
           'sucesso' => false,
           'sql' => '',
           'paginas' => 0,
           'erro' => $erro_mensagem
        ];
    }
    //Retorno do sucesso
    return [
        'sucesso' => true,
        'sql' => $sql_paginas_batch,
        'paginas' => $paginas_processadas,
        'erro' => ''
    ];
}