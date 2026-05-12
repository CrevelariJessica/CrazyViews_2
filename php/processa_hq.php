<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

//------------------------------------------------------------------------------
require_once '../config/config.php';
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME, DB_PORT);
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'error' => 'Erro de conexão: ' . $conn->connect_error]);
    exit();
}
//------------------------------------------------------------------------------
// RECEBER E SANITIZAR OS DADOS DO FORMULÁRIO
// Os nomes dentro de $_POST[] devem corresponder aos 'name' dos inputs HTML.
$titulo = $conn->real_escape_string($_POST['tituloLocal']);
$original = $conn->real_escape_string($_POST['tituloOriginal']);
$ano_lancamento = (int)$_POST['lancamentoAno'];
$genero_nome = $conn->real_escape_string($_POST['gender']);
$editora_nome = $conn->real_escape_string($_POST['publisher']);
//------------------------------------------------------------------------------
// LÓGICA DE INSERÇÃO - INSERIR EM MÚLTIPLAS TABELAS (titulos, edicoes, etc.)
// Função auxiliar para buscar/inserir e retornar o ID (para Editora e Gênero)
function get_or_create_id($conn, $table, $column_name, $value) {
    // Tenta inserir (IGNORE evita erro se já existir)
    $sql_insert = "INSERT IGNORE INTO $table ($column_name) VALUES ('$value')";
    $conn->query($sql_insert);

    // Busca o ID (se foi inserido agora ou já existia)
    $result = $conn->query("SELECT id FROM $table WHERE $column_name = '$value'");
    // verificação para evitar erro se a consulta falhar
    if ($result && $row = $result->fetch_assoc()) {
        return $row['id'];
    }
    return null; // Retorna nulo ou um valor de erro
}
//------------------------------------------------------------------------------
// Garante que GÊNERO e EDITORA existam e pega seus IDs
$id_genero = get_or_create_id($conn, 'generos', 'genero', $genero_nome);
$id_editora = get_or_create_id($conn, 'editoras', 'editora', $editora_nome);
//------------------------------------------------------------------------------
// INSERIR NA TABELA TITULOS
$sql_titulo = "INSERT INTO titulos (titulo, original, lancamento, id_editora, id_genero)
               VALUES ('$titulo', '$original', $ano_lancamento, $id_editora, $id_genero)";

if ($conn->query($sql_titulo) === TRUE) {
    $id_novo_titulo = $conn->insert_id; // ID do título recém-criado

    // Retorna JSON de sucesso
    echo json_encode([
        'success' => true,
        'id' => $id_novo_titulo,
        'message' => 'Título criado com sucesso'
    ]);
} else {
    // Retorna JSON de erro
    echo json_encode([
        'success' => false,
        'error' => 'Erro ao inserir título: ' . $conn->error
    ]);
}
//------------------------------------------------------------------------------
// FECHAR CONEXÃO
$conn->close();