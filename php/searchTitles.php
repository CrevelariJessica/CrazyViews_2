<?php
require_once 'config/config.php';
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME, DB_PORT);
if ($conn->connect_error) {
    echo "<p style='color: red;'> Erro na conexão com o DB: " . $conn->connect_error . "</p>";
    return;
}
//------------------------------------------------------------------------------
//Sanear o termo de busca
$termo_busca = $conn->real_escape_string($_GET['termo'] ?? '');
$termo_filtrado = "%" . $termo_busca . "%";
//------------------------------------------------------------------------------
//usa LIKE para encontrar correspondencias parciais
$sql_busca = "SELECT
                t.id,
                t.titulo,
                COUNT(e.id) AS edicoes_count
              FROM titulos t
              LEFT JOIN edicoes e ON t.id = e.id_titulo
              WHERE LOWER (t.titulo) LIKE LOWER ('$termo_filtrado') 
              GROUP BY t.id, t.titulo
              ORDER BY t.titulo ASC";
//------------------------------------------------------------------------------
//verifica se a query falhou
$result = $conn->query($sql_busca);
if (!$result) {
    // Se falhar, exibe o erro exato do MySQL (apenas para DEBUG)
    echo "<p style='color: red;'>ERRO SQL: " . $conn->error . "</p>";
    // E exibe a query que foi executada (também para DEBUG!)
    echo "<p>Query executada: {$sql_busca}</p>";
    return;
}
//------------------------------------------------------------------------------
if ($result->num_rows > 0){
    while ($titulo = $result->fetch_assoc()){
        $id_titulo = $titulo['id'];
        $nome_titulo = htmlspecialchars($titulo['titulo']);
        $edicoes = (int)$titulo['edicoes_count'];
        
        $link_template = "php/templateUpdate.php?id=" . $id_titulo;
        
        echo "<div class='resumo-titulo'>";
        echo "  <h2>Título: {$nome_titulo}</h2>";
        echo "  <p>Edições: {$edicoes}</p>";
        echo "  <a href='{$link_template}' class='btn-acesso'>Acessar</a>";
        echo "</div>";
    }
}else{
    echo "<p>Nenhum título encontrado.</p>";
}
//------------------------------------------------------------------------------
$conn->close();