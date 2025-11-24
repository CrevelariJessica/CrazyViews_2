<?php
header('Content-Type: application/json; charset=utf-8');

require_once '../config/config.php';
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME, DB_PORT);

if ($conn->connect_error) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Falha na conexão com o banco de dados.']);
    exit();
}

$id_titulo = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id_titulo <= 0) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'ID do título inválido.']);
    $conn->close();
    exit();
}
$sql_banner = "
    SELECT  
        E1.edicao,
        MAX(CASE WHEN P1.pagina = 1 THEN P1.arquivo END) AS caminho_capa,
        GROUP_CONCAT(P1.arquivo ORDER BY P1.pagina ASC SEPARATOR ',') AS paginas_string
    FROM
        edicoes E1
    LEFT JOIN
        paginas P1 ON E1.id = P1.id_edicao
    WHERE
        E1.id_titulo = $id_titulo
    GROUP BY
        E1.id, E1.edicao
    ORDER BY
        E1.edicao ASC
    LIMIT 1;
";
$result_banner = $conn->query($sql_banner);

// Verifica se a consulta falhou (erro no SQL, não nos dados)
if ($result_banner === FALSE) {
    $response = ['status' => 'erro', 'mensagem' => 'Erro na consulta SQL: ' . $conn->error, 'sql' => $sql_banner];
} else {
    $banner_data = $result_banner->fetch_assoc();
    
    $response = [
        'status' => 'sucesso', 
        'banner_data' => $banner_data,
        'mensagem' => $banner_data ? 'Dados do banner carregados com sucesso.' : 'Edição inicial não encontrada. (Apesar de o SQL estar OK)'
    ];
}

$conn->close();
echo json_encode($response);
?>