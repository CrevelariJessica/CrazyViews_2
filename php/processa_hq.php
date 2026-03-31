<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
//------------------------------------------------------------------------------
require_once '../config/config.php';
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME, DB_PORT);
if ($conn->connect_error) {
    die("A conexão falhou. Verifique se o MySQL está ativo e a senha correta: " . $conn->connect_error);
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
    
    //leva para o template do titulo recem criado    
    // Limpa os resultados do multi_query antes de continuar (necessário)
    while($conn->more_results() && $conn->next_result()) {}
    // Redireciona para a página desejada ou exibe uma mensagem de sucesso
    header("Location: ../principal.html?page=templateUpdate&id=" . $id_novo_titulo . "&novo=1");
    exit();
} else {
    echo "Erro ao inserir Título: " . $conn->error;
}
//------------------------------------------------------------------------------
// FECHAR CONEXÃO
$conn->close();