<?php
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once '../config/config.php';
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME, DB_PORT);

// Obter e Sanitizar o ID
$id_titulo = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($conn->connect_error || $id_titulo <= 0) {
    echo json_encode(['error' => 'Conexão ou ID inválido']);
    exit();
}

// Buscar os dados
$sql = "SELECT 
            t.id, t.titulo, t.original, t.lancamento AS ano_lancamento,
            e.editora AS editora_nome, g.genero AS genero_nome
        FROM 
            titulos t
        JOIN 
            editoras e ON t.id_editora = e.id
        JOIN 
            generos g ON t.id_genero = g.id
        WHERE 
            t.id = $id_titulo";

$result = $conn->query($sql);
$data = [];

if ($result && $row = $result->fetch_assoc()) {
    $data = $row; // Retorna o array associativo com os dados
}

$conn->close();

echo json_encode($data);