<?php
function processar_cbz($conn, $id_edicao, $edicao_numero, $file_data, $diretorio_destino, $pasta_titulo){

    $paginas_processadas = 0;
    $sql_paginas_batch = '';
    $upload_sucesso = true;
    $erro_mensagem = '';
    
    // Pega o caminho temporário do PRIMEIRO (e único) arquivo do array
    $arquivo_temporario = $file_data['tmp_name'][0]; 
    $zip = new ZipArchive();
        
    if($zip->open($arquivo_temporario) === TRUE){                
        //COLETAR E ORDENAR OS ARQUIVOS PRIMEIRO
        $arquivos_para_processar = [];
        for ($i = 0; $i < $zip->numFiles; $i++){
            $nome_arquivo_interno = $zip->getNameIndex($i);
            $extensao_interna = strtolower(pathinfo($nome_arquivo_interno, PATHINFO_EXTENSION));
            // Filtra pastas e não-imagens
            if (substr($nome_arquivo_interno, -1) == '/' || !in_array($extensao_interna, ['jpg', 'jpeg', 'png'])){
                continue;
            }
            $arquivos_para_processar[] = $nome_arquivo_interno;
        }
        //ORDENAR ALFABETICAMENTE
        natcasesort($arquivos_para_processar);
        
        //Iterar lista ordenada
        foreach ($arquivos_para_processar as $nome_arquivo_interno){
            // Re-obtendo a extensão
            $extensao_interna = strtolower(pathinfo($nome_arquivo_interno, PATHINFO_EXTENSION));
            
            // Os nomes finais agora seguem a ordem do array ordenado
            $nome_final = sprintf("pagina_%03d.%s", ($paginas_processadas + 1), $extensao_interna);
            $caminho_final_servidor = $diretorio_destino . $nome_final;
            
            if($zip->extractTo($diretorio_destino, $nome_arquivo_interno)){
                
                $caminho_extraido = $diretorio_destino . $nome_arquivo_interno;
                
                // Move/renomeia o arquivo                
                if (rename($caminho_extraido, $caminho_final_servidor)){
                    
                    //Permissão
                    if (file_exists($caminho_final_servidor) && !chmod($caminho_final_servidor, 0644)) {
                         error_log("Aviso: Falha ao definir permissões 0644 para CBZ: " . $caminho_final_servidor);
                    }
                    
                    // Caminho para o banco de dados
                    $caminho_db = "files/{$pasta_titulo}/edicao_{$edicao_numero}/{$nome_final}";
                    
                    // Monta a query para multi_query (mais eficiente)
                    $caminho_db_esc = $conn->real_escape_string($caminho_db);  
                    $pagina_num = $paginas_processadas + 1;
                    
                    $sql_paginas_batch .= "INSERT INTO paginas (id_edicao, pagina, arquivo) 
                                           VALUES ({$id_edicao}, {$pagina_num}, '{$caminho_db_esc}');";
                    
                    $paginas_processadas++;
                } else {
                     // Falha no rename
                     $upload_sucesso = false;
                     // Tenta remover o arquivo extraído que falhou ao renomear
                     if (file_exists($caminho_extraido)) {
                         unlink($caminho_extraido);
                     }
                     break; 
                }
            }else{
                $upload_sucesso = false;
                break; // Para o loop imediatamente
            }
        }
        $zip->close();
        
        // Trata a falha PÓS-LOOP (se quebrou no meio ou não achou páginas)
        if(!$upload_sucesso || $paginas_processadas === 0){
            $erro_mensagem = "Erro: Falha na extração de uma página ou o arquivo CBZ não possui imagens válidas.";
            
            //retorno do erro para processa_edicao.php resolver             
            return [
               'sucesso' => false,
               'sql' => '',
               'paginas' => 0, // Garante que retorne 0
               'erro' => $erro_mensagem
            ];
        }
        
        // RETORNO DE SUCESSO
        return [
            'sucesso' => $upload_sucesso,
            'sql' => $sql_paginas_batch,
            'paginas' => $paginas_processadas,
            'erro' => ''
        ];
        
    } else {
        // FALHA NA ABERTURA DO ZIP
        $erro_mensagem = "Erro: Não foi possível abrir o arquivo ZIP/CBZ. Verifique se o arquivo está corrompido.";
        
        return[
          'sucesso' => false,
          'sql' => '',
          'paginas' => 0,
          'erro' => $erro_mensagem
        ];      
    }
}