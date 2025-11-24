<?php
header('Content-Type: application/json');
ini_set('display_errors', 0);
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

function retornar_erro($mensagem, $conn = null) {
    $response = ['status' => 'erro', 'mensagem' => $mensagem];
    if ($conn) $conn->close();
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}
// -----------------------------------------------------------------------------
// Conexão BD
require_once '../config/config.php';
// Conexão Usuário (define ID_USUARIO_PADRAO)
require_once '../config/db_constants.php';

$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME, DB_PORT);
if ($conn->connect_error) {
    retornar_erro("A conexão com o banco de dados falhou: " . $conn->connect_error);
}
// -----------------------------------------------------------------------------
// DEFINIÇÃO GLOBAL DE VARIÁVEIS CHAVE
// ID_USUARIO_PADRAO é um INT seguro e já sanitizado
$id_usuario_filtro = ID_USUARIO_PADRAO; 
// -----------------------------------------------------------------------------
// LÓGICA DE CONTAGEM GERAL (PARA O INDEX) - Roda e Encerra
if (isset($_GET['mode']) && ($_GET['mode'] === 'general_counts' || $_GET['mode'] === 'favorites_count')) {
    // 1. Consulta para TÍTULOS GERAIS (Geralmente titulos.id)
    $sql_geral = "SELECT COUNT(id) AS total_titulos_geral FROM titulos";
    $data_geral = $conn->query($sql_geral)->fetch_assoc() ?? ['total_titulos_geral' => 0];
    
    // 2. Consulta para FAVORITOS DO USUÁRIO (USANDO PREPARED STATEMENT)
    $sql_fav = "SELECT COUNT(id) AS total_favoritos FROM titulos_favoritos WHERE id_usuario = ?";
    $stmt_fav = $conn->prepare($sql_fav);
    
    // Assumindo que ID_USUARIO_PADRAO é um inteiro (i)
    $stmt_fav->bind_param("i", $id_usuario_filtro); 
    $stmt_fav->execute();
    $result_fav = $stmt_fav->get_result();
    $data_fav = $result_fav->fetch_assoc() ?? ['total_favoritos' => 0];
    $stmt_fav->close();
    
    // 3. Consulta para EDIÇÕES TOTAIS (Usando 'paginas > 0' para edições válidas)
    $sql_edicoes = "SELECT COUNT(id) AS total_edicoes FROM edicoes WHERE paginas > 0";
    $data_edicoes = $conn->query($sql_edicoes)->fetch_assoc() ?? ['total_edicoes' => 0];
    
    // RETORNA O JSON UNIFICADO e encerra a execução
    $response = [
        'status' => 'sucesso',
        'mensagem' => 'Contadores gerais carregados com sucesso.',
        'total_geral_cadastrados' => (int)$data_geral['total_titulos_geral'], 
        'total_favoritos_usuario' => (int)$data_fav['total_favoritos'], 
        'total_edicoes' => (int)$data_edicoes['total_edicoes']
    ];

    $conn->close();
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit(); 
}
// -----------------------------------------------------------------------------
// LÓGICA DE PAGINAÇÃO E FILTROS
// Parâmetros de Paginação (Garantidos como INT)
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1; // Não é usado diretamente, mas mantido
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;

$limit = max(1, min(100, $limit)); // Limite entre 1 e 100
// O offset é o valor real a ser usado no SQL
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0; 

// Variáveis para Prepared Statement
$where_conditions = "1=1";
$bind_params = [];
$bind_types = "";
$having_conditions = ""; 

$is_favorite_mode = isset($_GET['mode']) && $_GET['mode'] === 'favorites';
// ---------------------------------------------------
// Aplicação dos Filtros WHERE
// Filtro por Caractere Inicial (Alfabeto)
if (isset($_GET['filter_char']) && !empty($_GET['filter_char'])) {
    $char = $_GET['filter_char'];
    if (strtoupper($char) === 'NUM') { 
        // REGEXP para números é seguro, pois a string '^[0-9]' é hardcoded.
        $where_conditions .= " AND t.titulo REGEXP '^[0-9]'";
    } else {
        $where_conditions .= " AND t.titulo LIKE ?";
        $bind_types .= "s";
        $bind_params[] = $char . '%'; 
    }
}
// Filtro por Título (Busca geral)
if (isset($_GET['titulo']) && !empty($_GET['titulo'])) {
    $where_conditions .= " AND t.titulo LIKE ?";
    $bind_types .= "s";
    $bind_params[] = "%" . $_GET['titulo'] . "%"; 
}
// Filtro por Título Original
if (isset($_GET['titulo_original']) && !empty($_GET['titulo_original'])) {
    $where_conditions .= " AND t.original LIKE ?";
    $bind_types .= "s";
    $bind_params[] = "%" . $_GET['titulo_original'] . "%"; 
}
// Filtro por Editora
if (isset($_GET['editora']) && !empty($_GET['editora'])) {
    // Nota: O filtro de Editora deve ser aplicado à tabela 'e', que é incluída nos JOINs padrão.
    $where_conditions .= " AND e.editora LIKE ?"; 
    $bind_types .= "s";
    $bind_params[] = "%" . $_GET['editora'] . "%"; 
}
// Filtro por Gênero
if (isset($_GET['genero']) && !empty($_GET['genero'])) {
    // Nota: O filtro de Gênero deve ser aplicado à tabela 'g', que é incluída nos JOINs padrão.
    $where_conditions .= " AND g.genero LIKE ?";
    $bind_types .= "s";
    $bind_params[] = "%" . $_GET['genero'] . "%"; 
}
// Filtro por Ano de Lançamento (t.lancamento) - Range ou Ano Específico
if (isset($_GET['data_lancamento']) && is_numeric($_GET['data_lancamento'])) {
    $year = (int)$_GET['data_lancamento'];
    $where_conditions .= " AND t.lancamento = ?";
    $bind_types .= "i";
    $bind_params[] = $year;
} else {
    if (isset($_GET['lancamento_min']) && is_numeric($_GET['lancamento_min'])) {
        $where_conditions .= " AND t.lancamento >= ?";
        $bind_types .= "i";
        $bind_params[] = (int)$_GET['lancamento_min'];
    }
    if (isset($_GET['lancamento_max']) && is_numeric($_GET['lancamento_max'])) {
        $where_conditions .= " AND t.lancamento <= ?";
        $bind_types .= "i";
        $bind_params[] = (int)$_GET['lancamento_max'];
    }
}
// Filtro por Quantidade de Páginas (E_CAPA.paginas) - Range da Primeira Edição
if (isset($_GET['paginas_min']) && is_numeric($_GET['paginas_min'])) {
    $where_conditions .= " AND E_CAPA.paginas >= ?";
    $bind_types .= "i";
    $bind_params[] = (int)$_GET['paginas_min'];
}
if (isset($_GET['paginas_max']) && is_numeric($_GET['paginas_max'])) {
    $where_conditions .= " AND E_CAPA.paginas <= ?";
    $bind_types .= "i";
    $bind_params[] = (int)$_GET['paginas_max'];
}
// --------------------------------------------------------------------------
// Filtro Pós-Agregação (HAVING) para "Possui Edições"
if (isset($_GET['has_editions'])) {
    $has_editions = strtolower($_GET['has_editions']);
    
    if ($has_editions === 'yes') {
        $having_conditions .= " HAVING COUNT(e_count.id) > 0";
    } elseif ($has_editions === 'no') {
        $having_conditions .= " HAVING COUNT(e_count.id) = 0";
    }
}
// ---------------------------------------------------
// Definição dos JOINs (Refatorada para maior clareza)

// 1. Define o tipo de JOIN para favoritos
$favorite_join_type = "LEFT"; // Padrão: mostra todos os títulos
if ($is_favorite_mode) {
    // Se o modo for 'favorites', só queremos títulos que SÃO favoritos
    $favorite_join_type = "INNER";
}
$base_joins = "
    INNER JOIN editoras e ON t.id_editora = e.id
    INNER JOIN generos g ON t.id_genero = g.id
    {$favorite_join_type} JOIN titulos_favoritos tf ON t.id = tf.id_titulo AND tf.id_usuario = {$id_usuario_filtro}
";
// Joins Complexos para Capa (E_CAPA, P_CAPA) e Contagem de Edições (e_count)
$complex_joins = "
    -- 1. Encontra o ID da edição com o menor número de 'edicao' (a primeira) para cada título
    LEFT JOIN (
        SELECT E_MIN.id_titulo, MIN(E_MIN.edicao) AS edicao_minima
        FROM edicoes E_MIN
        WHERE E_MIN.paginas > 0
        GROUP BY E_MIN.id_titulo
    ) AS min_edicao ON min_edicao.id_titulo = t.id

    -- 2. Encontra o ID real da edição que tem o número mínimo de 'edicao' (para filtro de paginas)
    LEFT JOIN edicoes E_CAPA ON E_CAPA.id_titulo = t.id 
        AND E_CAPA.edicao = min_edicao.edicao_minima
        AND E_CAPA.paginas > 0

    -- 3. Pega o arquivo da página 1 (P_CAPA)
    LEFT JOIN paginas P_CAPA ON P_CAPA.id_edicao = E_CAPA.id AND P_CAPA.pagina = 1

    -- 4. Junta edições para contagem geral (e_count) - Necessário para o filtro HAVING
    LEFT JOIN edicoes e_count ON t.id = e_count.id_titulo AND e_count.paginas > 0
";
// Constrói a cláusula de JOIN completa
$join_clause = $base_joins . $complex_joins;
// ---------------------------------------------------
// CONTAGEM TOTAL DE REGISTROS
// Se houver HAVING, precisamos contar o resultado de uma subquery com GROUP BY e HAVING
if (!empty($having_conditions)) {
    $sql_count = "
        SELECT COUNT(*) AS total_registros FROM (
            SELECT 
                t.id
            FROM 
                titulos t 
                $join_clause 
            WHERE 
                $where_conditions
            GROUP BY t.id
            $having_conditions
        ) AS filtered_titles_count;
    ";
} else {
    // Contagem simples se não houver HAVING
    $sql_count = "
        SELECT 
            COUNT(DISTINCT t.id) AS total_registros 
        FROM 
            titulos t 
            $join_clause 
        WHERE 
            $where_conditions
    ";
}
$stmt_count = $conn->prepare($sql_count);

if (!$stmt_count) {
    retornar_erro('Erro ao preparar contagem SQL: ' . $conn->error, $conn);
}
// Bind dos parâmetros
if (!empty($bind_params)) {
    // Usando o operador '...' (splat operator) para desempacotar o array como argumentos
    $stmt_count->bind_param($bind_types, ...$bind_params);
}
$stmt_count->execute();
$result_count = $stmt_count->get_result();
$data_count = $result_count->fetch_assoc();
$total_registros = (int)($data_count['total_registros'] ?? 0);
$stmt_count->close();
// Tratamento de Lista Vazia
if ($total_registros === 0) {
    $mensagem = $is_favorite_mode ? 'Nenhum título adicionado aos Favoritos.' : 'Nenhum título encontrado com o filtro atual.';
    $response = [
        'status' => 'sucesso',
        'mensagem' => $mensagem,
        'total_registros' => 0,
        'titulos' => []
    ];
    $conn->close();
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}
// ---------------------------------------------------
// CONSULTA SQL PRINCIPAL
$limit_clause = " LIMIT $limit OFFSET $offset";

$sql = "
    SELECT
        t.id AS id_titulo,
        t.titulo,
        t.original,
        t.lancamento,
        t.id_genero,
        e.editora AS editora, 
        g.genero,
        
        -- Verifica se o título está na tabela de favoritos para o usuário atual
        (CASE WHEN tf.id_titulo IS NOT NULL THEN 1 ELSE 0 END) AS is_favorito, 

        -- Caminho da capa (url_capa) da primeira página da primeira edição
        P_CAPA.arquivo AS url_capa, 
        
        -- Contagem de edições válidas (paginas > 0)
        COUNT(e_count.id) AS edicoes_por_titulo
    FROM
        titulos t
        {$join_clause}  
        
    WHERE
        $where_conditions
    GROUP BY
        t.id, t.titulo, t.original, t.lancamento, t.id_genero, e.editora, g.genero, tf.id_titulo, P_CAPA.arquivo
        
    {$having_conditions} -- Adiciona a cláusula HAVING aqui

    ORDER BY
        t.titulo ASC
    {$limit_clause};
";
// ---------------------------------------------------
// Execução da Consulta Principal (usando Prepared Statement)
$stmt = $conn->prepare($sql);

if (!$stmt) {
    retornar_erro('Erro ao preparar consulta principal SQL: ' . $conn->error, $conn);
}
// Bind dos parâmetros (os mesmos usados na query de contagem)
if (!empty($bind_params)) {
    $stmt->bind_param($bind_types, ...$bind_params);
}
$stmt->execute();
$result = $stmt->get_result();
if ($result === FALSE) {
    retornar_erro('Erro na consulta SQL principal: ' . $stmt->error, $conn);
} 
// -----------------------------------------------------------------------------
// PROCESSAMENTO DOS RESULTADOS
$titulos = [];
while ($row = $result->fetch_assoc()) {
    $titulos[] = $row;
}
$stmt->close();
// -----------------------------------------------------------------------------
// MONTA A RESPOSTA JSON FINAL
$conn->close();

$response = [
    'status' => 'sucesso',
    'mensagem' => 'Lista de títulos carregada com sucesso.',
    'total_registros' => $total_registros, 
    'titulos' => $titulos
];

echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);