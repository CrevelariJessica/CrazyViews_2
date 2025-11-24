<?php
header('Content-Type: application/json');
ini_set('display_errors', 0);

//variavel para guardar respostas
$response=[
  'status' => 'erro',
  'mensagem' => 'Ocorreu um erro desconhecido.'
];
//função de erro simplificada
function retornar_erro($msg){
    global $response;
    $response['mensagem'] = $msg;
    echo json_encode($response);
    exit();
}
//conexão-----------------------------------------------------------------------
require_once '../config/config.php';
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME, DB_PORT);
if($conn->error){
    retornar_erro("A conexão com o banco de dados falhou: " . $conn->connect_error);
}
//------------------------------------------------------------------------------
$limite = 10; //limite de itens por carga
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0; // Se não houver offset, começa em 0
//coletar validação do ID do Título---------------------------------------------

$id_titulo = 0;

if (isset($_GET['id']) && is_numeric($_GET['id']) && $_GET['id'] > 0) {
    // Apenas pegue o valor se ele existir, for um número e for maior que zero.
    $id_titulo = (int)$_GET['id'];
}

if ($id_titulo === 0) {
    retornar_erro("Erro de validação: ID do título (id_titulo) não fornecido ou inválido.");
}
//consultar banco de dados------------------------------------------------------
$sql = "SELECT 
            e.id, 
            e.edicao, 
            e.data_lancamento, 
            e.paginas,
            DATE_FORMAT(e.data_lancamento, '%m/%Y') AS data_lancamento_formatada,
            MAX(CASE WHEN p.pagina = 1 THEN p.arquivo ELSE NULL END) AS caminho_capa,
            GROUP_CONCAT(p.arquivo ORDER BY p.pagina ASC) AS caminhos_paginas_string
        FROM 
            edicoes e
        LEFT JOIN 
            paginas p ON e.id = p.id_edicao 
        WHERE 
            e.id_titulo = ? 
        GROUP BY
            e.id, e.edicao, e.data_lancamento, e.paginas, data_lancamento_formatada
        HAVING
            caminhos_paginas_string IS NOT NULL AND caminhos_paginas_string != ''
        ORDER BY 
            e.edicao ASC,
            e.id ASC
        LIMIT ? OFFSET ?";

$stmt = $conn->prepare($sql);
if ($stmt === FALSE) {
    retornar_erro("Erro ao preparar consulta SQL: " . $conn->error);
}
// 'iii' para 3 inteiros (id_titulo, limite, offset)
$stmt->bind_param("iii", $id_titulo, $limite, $offset); 
$stmt->execute();
$result = $stmt->get_result();
//Processar resultado-----------------------------------------------------------
$edicoes = [];
if ($result->num_rows > 0){
    // Captura o timestamp atual para usar como Cache Buster em todos os URLs.
    $cache_buster = time(); 
    
    while ($row = $result->fetch_assoc()){
        
        // 1. Obtém os caminhos brutos das páginas
        $raw_page_paths = [];
        if (!empty($row['caminhos_paginas_string'])) {
            $raw_page_paths = explode(',', $row['caminhos_paginas_string']);
        }
        unset($row['caminhos_paginas_string']); 

        // 2. Processa a lista de páginas: aplica o prefixo "../" e o Cache Buster a CADA página
        $processed_page_paths = [];
        foreach ($raw_page_paths as $page_path) {
            if (!empty($page_path)) {
                // CORREÇÃO: Usa o caminho do DB e adiciona o prefixo e Cache Buster
                $processed_page_paths[] = "../{$page_path}?v={$cache_buster}";
            }
        }
        // Armazena a lista de caminhos de páginas processada para o leitor
        $row['caminho_paginas'] = $processed_page_paths; 

        // 3. LÓGICA DO CACHE BUSTER para a Capa
        if (!empty($row['caminho_capa'])) {
            $cover_filename = $row['caminho_capa']; 
            
            // Usamos o caminho completo do DB, adicionamos apenas o "../" e o Cache Buster.
            $full_path = "../{$cover_filename}?v={$cache_buster}";
            
            // Retorna o caminho cache-busted em um novo campo.
            $row['caminho_capa_cb'] = $full_path; 
        } else {
            $row['caminho_capa_cb'] = null;
        }
        
        $edicoes[] = $row;
    }
    $result->free(); //limpa memória
}
$conn->close();

//retorno sucesso---------------------------------------------------------------
$response = [
    'status' => 'sucesso',
    'mensagem' => 'Edições carregadas com sucesso.',
    'edicoes' => $edicoes,
    'total_carregado' => count($edicoes),
    'limite' => $limite
];

echo json_encode($response);