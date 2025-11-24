<?php
function processar_image($conn, $id_edicao, $edicao_numero, $file_data_array, $diretorio_destino, $pasta_titulo) { 

    $paginas_processadas = 0;
    $sql_paginas_batch = '';
    $upload_sucesso = true;
    $erro_mensagem = '';
    
    $total_arquivos = count($file_data_array['name']);
    
    for ($i = 0; $i < $total_arquivos; $i++){
        
        // Se o item do array estiver vazio (o usuário desmarcou no input, por exemplo)
        if (empty($file_data_array['name'][$i])) {
             continue; 
        }

        if($file_data_array['error'][$i] !== UPLOAD_ERR_OK){
            $upload_sucesso = false;
            $erro_mensagem = "Erro no upload do arquivo #{$i}: Código " . $file_data_array['error'][$i];
            error_log($erro_mensagem);
            break;
        }
        
        $extensao = strtolower(pathinfo($file_data_array['name'][$i], PATHINFO_EXTENSION));
        
        if (!in_array($extensao, ['jpg', 'jpeg', 'png'])) {
            continue; // Ignora arquivos que não são imagem
        }

        $pagina_num = $paginas_processadas + 1;
        $nome_final = sprintf("pagina_%03d.%s", $pagina_num, $extensao);

        $caminho_destino_servidor = $diretorio_destino . $nome_final;
        $caminho_arquivo_db = "files/{$pasta_titulo}/edicao_{$edicao_numero}/{$nome_final}";

        if(move_uploaded_file($file_data_array['tmp_name'][$i], $caminho_destino_servidor)){
            
            if (!chmod($caminho_destino_servidor, 0644)) {
                 error_log("Aviso: Falha ao definir permissões 0644 para a imagem solta: " . $caminho_destino_servidor);
            }
            
            $caminho_db_esc = $conn->real_escape_string($caminho_arquivo_db);

            $sql_paginas_batch .= "INSERT INTO paginas (id_edicao, pagina, arquivo)
                                   VALUES ({$id_edicao}, {$pagina_num}, '{$caminho_db_esc}');";

            $paginas_processadas++;
        }else{
            $upload_sucesso = false;
            $erro_mensagem = "Falha ao mover o arquivo de upload para: " . $caminho_destino_servidor;
            error_log($erro_mensagem);
            break;
        }
    }
    
    if (!$upload_sucesso || $paginas_processadas === 0){
        // RETORNO ERRO
        $erro_mensagem = $erro_mensagem ?: "Nenhuma imagem válida foi enviada ou falha desconhecida.";
        
        return [
           'sucesso' => false,
           'sql' => '',
           'paginas' => 0, 
           'erro' => $erro_mensagem
        ];
    }
    
    // RETORNO DE SUCESSO
    return [
        'sucesso' => true,
        'sql' => $sql_paginas_batch,
        'paginas' => $paginas_processadas,
        'erro' => ''
    ];
}