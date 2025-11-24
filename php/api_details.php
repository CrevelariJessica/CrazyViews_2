<?php
header('Content-Type: application/json');

require_once '../config/config.php';
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME, DB_PORT);

$id_titulo = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$response = ['status' => 'erro', 'mensagem' => 'ID inválido ou erro de DB.'];

if ($conn->connect_error) {
    $response['mensagem'] = "Erro de conexão com banco: " . $conn->connect_error;
    echo json_encode($response);
    exit;
}

if ($id_titulo > 0) {
    $sql = "SELECT id, titulo, original, lancamento, id_editora, id_genero  FROM titulos WHERE id = $id_titulo LIMIT 1";
    $result = $conn->query($sql);
    $dados_titulo = ($result && $row = $result->fetch_assoc()) ? $row : null;

    // SEGUNDA CONSULTA (Lista de Edições)
    $edicoes_lista = [];
    $sql_todas_edicoes = "WHERE id_titulo = $id_titulo ORDER BY edicao ASC";
    $result_edicoes = $conn->query($sql_todas_edicoes);
    
    if ($result_edicoes) {
        while ($row_edicao = $result_edicoes->fetch_assoc()) {

            $edicoes_lista[] = $row_edicao;
        }
    }

    if ($dados_titulo) {
        $response['status'] = 'sucesso';
        $response['mensagem'] = 'Dados carregados.';
        $response['titulo'] = $dados_titulo;
        $response['edicoes'] = $edicoes_lista;
    } else {
        $response['mensagem'] = "Título não encontrado.";
    }
    if ($result === FALSE) {
        $response['mensagem'] = "Erro na consulta SQL do título: " . $conn->error;
    }
}

$conn->close();
echo json_encode($response);
?>