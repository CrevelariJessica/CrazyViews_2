<?php
function gerar_nome_pasta($conn, $titulo) {
    // Escapa a variável para segurança, embora já seja um int
    $titulo = (int)$titulo; 
    
    // Consulta SQL para obter o nome
    $sql_titulo_nome = "SELECT titulo FROM titulos WHERE id = $titulo";
    $result_titulo = $conn->query($sql_titulo_nome);

    if ($result_titulo && $row_titulo = $result_titulo->fetch_assoc()) {
        $titulo_nome = $row_titulo['titulo'];
        
        // LÓGICA DE FORMATAÇÃO: Limpar, substituir espaços por '_', e limitar
        $pasta_titulo = str_replace(" ", "_", trim(mb_strtolower($titulo_nome)));
        $pasta_titulo = preg_replace('/[^A-Za-z0-9\_]/', '', $pasta_titulo); // Mantive o '_' aqui
        $pasta_titulo = substr($pasta_titulo, 0, 100);
        
        if (empty($pasta_titulo)) {
            $pasta_titulo = "titulo_{$titulo}";
        }
        
        return $pasta_titulo;
        
    } else {
        return false;
    }
}
//------------------------------------------------------------------------------
function formatar_data_sql($data_lancamento_mm_aaaa){
    //explode s string MM/AAAA em array
    $partes_data = explode('/', $data_lancamento_mm_aaaa);

    //verifica se array tem 2 partes (mes e ano)
    if (count($partes_data)==2){
        $mes = $partes_data[0];
        $ano = $partes_data[1];

        //garante que o mês tenha 2 digitos. 03 ao invés de 3
        $mes_formatado = str_pad($mes, 2, '0', STR_PAD_LEFT);

        //converte para formato sql: YYYY-MM-DD (01 será dia padrão)
        $data_sql_edicao = $ano . '-' . $mes_formatado . '-01';
        
        return $data_sql_edicao;
    }else{
        //se falhar insere, data nula
        $data_sql_edicao = '0000-00-00';
        return $data_sql_edicao;
    }
}
//------------------------------------------------------------------------------
function cria_diretorio($dir_base, $pasta_titulo, $edicao_numero){
    // Note que $dir_base agora já deve vir com o Separador!
    
    // Caminho da pasta do titulo
    $dir_titulo = $dir_base . $pasta_titulo . DIRECTORY_SEPARATOR;
    
    // Caminho final da pasta de edição
    $diretorio_destino = $dir_titulo . "edicao_" . $edicao_numero . DIRECTORY_SEPARATOR;
    
    // Criação de pastas recursivamente
    if (!is_dir($diretorio_destino)){
        // PERMISSÃO CRUCIAL: 0755 (Recomendado para diretórios na web)
        if (!mkdir($diretorio_destino, 0755, true)){ 
            return false;
        }
    }
    
    return $diretorio_destino;
}
// -----------------------------------------------------------------------------
function remover_diretorio_recursivo($dir) {
    if (!is_dir($dir)) {
        return;
    }
    // Adiciona o / final se não tiver
    $dir = rtrim($dir, '/\\') . DIRECTORY_SEPARATOR; 
    
    $files = array_diff(scandir($dir), array('.', '..'));
    foreach ($files as $file) {
        // Verifica se é diretório ou arquivo
        (is_dir($dir . $file)) ? remover_diretorio_recursivo($dir . $file) : unlink($dir . $file);
    }
    return rmdir($dir);
}