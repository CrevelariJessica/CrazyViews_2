<?php
if (!extension_loaded('rar')) {
    $GLOBALS['cbr_extensao_nao_carregada'] = [
        'sucesso' => false,
        'sql' => '',
        'paginas' => 0,
        'erro' => "Erro: extensão 'rar' não encontrada. Não é possível utilizar arquivos .cbr/.rar"
    ];
}
function processar_cbr($conn, $id_edicao, $edicao_numero, $file_data, $diretorio_destino, $pasta_titulo){

    $paginas_processadas = 0;
    $sql_paginas_batch = '';
    $upload_sucesso = true;
    $erro_mensagem = '';

    // Pega o caminho temporário do PRIMEIRO (e único) arquivo do array
    $arquivo_temporario = $file_data['tmp_name'][0]; 
    
    // Tenta abrir o arquivo RAR/CBR
    $rar = RarArchive::open($arquivo_temporario);
    
    if($rar !== FALSE){ // Se a abertura for bem-sucedida
        
        // 1. COLETAR E ORDENAR OS ARQUIVOS
        $arquivos_para_processar = [];
        $entradas_rar = $rar->getEntries();
        
        // Mapeia e filtra apenas arquivos de imagem
        foreach ($entradas_rar as $entrada){
            $nome_arquivo_interno = $entrada->getName();
            
            // Ignora diretórios e verifica se é uma imagem
            if (!$entrada->isDirectory()){ 
                $extensao_interna = strtolower(pathinfo($nome_arquivo_interno, PATHINFO_EXTENSION));
                
                if (in_array($extensao_interna, ['jpg', 'jpeg', 'png'])){
                    $arquivos_para_processar[$nome_arquivo_interno] = $entrada;
                }
            }
        }
        
        // 2. ORDENAR ALFABETICAMENTE
        // natcasesort ordena as chaves (os nomes dos arquivos) mantendo a associação com o objeto RarEntry
        $chaves_ordenadas = array_keys($arquivos_para_processar);
        natcasesort($chaves_ordenadas);
        
        // 3. Iterar lista ordenada e extrair
        foreach ($chaves_ordenadas as $nome_arquivo_interno){
            $entrada = $arquivos_para_processar[$nome_arquivo_interno];

            // Re-obtendo a extensão
            $extensao_interna = strtolower(pathinfo($nome_arquivo_interno, PATHINFO_EXTENSION));
            
            // Os nomes finais seguem a ordem do array ordenado
            $nome_final = sprintf("pagina_%03d.%s", ($paginas_processadas + 1), $extensao_interna);
            
            // A extração no PECL::rar é direta, mas não permite renomear durante.
            // Extraímos para o nome original e renomeamos depois.
            
            // Extrai para o destino (mantendo o nome original)
            if($entrada->extract($diretorio_destino)){
                
                $caminho_arquivo_extraido = $diretorio_destino . $nome_arquivo_interno;
                $caminho_final_servidor = $diretorio_destino . $nome_final;
                
                // Renomeia o arquivo
                if (rename($caminho_arquivo_extraido, $caminho_final_servidor)){
                    
                    // Permissão 0644 (para evitar o 404 de permissão)
                    if (file_exists($caminho_final_servidor) && !chmod($caminho_final_servidor, 0644)) {
                         error_log("Aviso: Falha ao definir permissões 0644 para CBR: " . $caminho_final_servidor);
                    }
                    
                    // Caminho para o banco de dados
                    $caminho_db = "files/{$pasta_titulo}/edicao_{$edicao_numero}/{$nome_final}";
                    
                    // Monta a query
                    $caminho_db_esc = $conn->real_escape_string($caminho_db);  
                    $pagina_num = $paginas_processadas + 1;
                    
                    $sql_paginas_batch .= "INSERT INTO paginas (id_edicao, pagina, arquivo) 
                                           VALUES ({$id_edicao}, {$pagina_num}, '{$caminho_db_esc}');";
                    
                    $paginas_processadas++;
                } else {
                     // Falha no rename
                     $upload_sucesso = false;
                     // Tenta remover o arquivo extraído que falhou ao renomear
                     if (file_exists($caminho_arquivo_extraido)) {
                         unlink($caminho_arquivo_extraido);
                     }
                     break; 
                }
            }else{
                $upload_sucesso = false;
                break; // Para o loop imediatamente
            }
        }
        
        $rar->close(); // Fecha o arquivo RAR
        
        // RETORNO DE SUCESSO OU FALHA PÓS-LOOP
        if(!$upload_sucesso || $paginas_processadas === 0){
            // Tenta remover arquivos que foram extraídos com sucesso antes da falha
            // (Opcional, mas recomendado para limpeza)
            
            $erro_mensagem = "Erro: Falha na extração/renomeação de uma página ou o arquivo CBR não possui imagens válidas.";
            
            return [
               'sucesso' => false,
               'sql' => '',
               'paginas' => 0, 
               'erro' => $erro_mensagem
             ];
        }
        
        return [
            'sucesso' => $upload_sucesso,
            'sql' => $sql_paginas_batch,
            'paginas' => $paginas_processadas,
            'erro' => ''
        ];
        
    } else {
        // FALHA NA ABERTURA DO RAR
        $erro_mensagem = "Erro: Não foi possível abrir o arquivo RAR/CBR. Verifique se o arquivo está corrompido ou se a extensão 'rar' está instalada e configurada corretamente.";
        
        return[
          'sucesso' => false,
          'sql' => '',
          'paginas' => 0,
          'erro' => $erro_mensagem
        ];      
    }
}