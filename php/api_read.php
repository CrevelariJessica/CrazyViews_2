<?php
// Objetivo: Retornar todas as páginas de uma Edição Específica
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0); // Desativado para produção

require_once '../config/config.php';
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME, DB_PORT);

if ($conn->connect_error) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Falha na conexão com o banco de dados.']);
    exit();
}
// Obtém o ID da EDIÇÃO
$id_edicao = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id_edicao <= 0) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'ID da edição inválido.']);
    $conn->close();
    exit();
}
// Consulta: Pega o número da edição, o total de páginas e a lista de arquivos
$sql_read = "
    SELECT
        E.edicao,
        COUNT(P.id) AS total_paginas,
        GROUP_CONCAT(P.arquivo ORDER BY P.pagina ASC SEPARATOR ',') AS paginas_string
    FROM
        edicoes E
    LEFT JOIN
        paginas P ON E.id = P.id_edicao
    WHERE
        E.id = $id_edicao
    GROUP BY
        E.id, E.edicao
    LIMIT 1;
";

$result_read = $conn->query($sql_read);

if ($result_read === FALSE) {
    $response = ['status' => 'erro', 'mensagem' => 'Erro na consulta SQL: ' . $conn->error];
} else {
    $read_data = $result_read->fetch_assoc();
    
    if ($read_data) {
        $cache_buster = time();
        $raw_pages = [];
        $processed_pages = [];
        
        // 1. Divide a string de caminhos brutos
        if (!empty($read_data['paginas_string'])) {
            $raw_pages = explode(',', $read_data['paginas_string']);
        }
        
        // 2. Processa cada caminho: aplica o "../" e o Cache Buster
        foreach ($raw_pages as $page_path) {
            if (!empty($page_path)) {
                // Usa o caminho do DB, adiciona o prefixo (para sair da pasta php/) e o Cache Buster
                $processed_pages[] = "../{$page_path}?v={$cache_buster}";
            }
        }
        
        // 3. Adiciona o array processado aos dados da edição e remove a string bruta
        $read_data['caminho_paginas_cb'] = $processed_pages;
        unset($read_data['paginas_string']);
        
        $response = [
            'status' => 'sucesso',
            'edicao_data' => $read_data,
            'mensagem' => 'Dados da edição carregados com sucesso.'
        ];
    } else {
        $response = [
            'status' => 'erro',
            'mensagem' => 'Edição não encontrada.'
        ];
    }
}

$conn->close();
echo json_encode($response);