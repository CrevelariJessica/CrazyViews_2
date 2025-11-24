<?php
header('Content-Type: application/json; charset=utf-8');

$response = [
    'status' => 'erro',
    'mensagem' => 'Erro desconhecido.'
];

function retornar_erro($msg, $conn = null){
    global $response;
    $response['mensagem'] = $msg;
    // Tenta reverter a transação em caso de erro
    if ($conn) {
        // Garantir que a transação é revertida
        $conn->rollback(); 
        $conn->close();
    }
    echo json_encode($response);
    exit();
}
//------------------------------------------------------------------------------
require_once '../config/config.php';
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME, DB_PORT);

if($conn->connect_error){
    retornar_erro("Falha na conexão com banco de dados: " . $conn->connect_error);
}
//------------------------------------------------------------------------------
$id_edicao = isset($_POST['id']) ? (int)$_POST['id'] : 0;

if ($id_edicao <= 0) {
    retornar_erro("ID da edição inválido ou não fornecido.", $conn);
}
//------------------------------------------------------------------------------
require_once '../lib/upEdAux.php';
// --------------------------------------------------------------------------
// INÍCIO DA TRANSAÇÃO
$conn->begin_transaction(); 
// --------------------------------------------------------------------------
//Função para deletar a pasta da edição
function deleteDirectory($dir) {
    if (!file_exists($dir)) {
        return true; // Se não existe, já está "deletado"
    }
    if (!is_dir($dir)) {
        return unlink($dir); // Se for um arquivo, deleta
    }
    
    // Varre o conteúdo do diretório
    foreach (scandir($dir) as $item) {
        if ($item == '.' || $item == '..') {
            continue;
        }
        
        $path = $dir . DIRECTORY_SEPARATOR . $item;
        
        // Chama a si mesma para subdiretórios (recursivo)
        if (is_dir($path)) {
            deleteDirectory($path);
        } else {
            // Deleta o arquivo
            unlink($path);
        }
    }
    
    // Por fim, deleta o diretório vazio
    return rmdir($dir);
}
//------------------------------------------------------------------------------
try {
    // Obter informações da edição ANTES de deletar (ID do Título e Número)
    $sql_info = "SELECT id_titulo, edicao FROM edicoes WHERE id = ?";
    if ($stmt_info = $conn->prepare($sql_info)) {
        $stmt_info->bind_param("i", $id_edicao);
        $stmt_info->execute();
        $result_info = $stmt_info->get_result();

        if ($row_info = $result_info->fetch_assoc()) {
            $id_titulo = $row_info['id_titulo'];
            $numero_edicao = $row_info['edicao'];
        } else {
            retornar_erro("Edição não encontrada no banco de dados.", $conn);
        }
        $stmt_info->close();
    } else {
        retornar_erro("Falha na preparação SQL para obter info da edição: " . $conn->error, $conn);
    }
    // Obter o nome da pasta do Título
    // precisa da função gerar_nome_pasta() que está no upEdAux.php
    $pasta_titulo = gerar_nome_pasta($conn, $id_titulo); 
    if (!$pasta_titulo) {
        // Isso deve ser raro, mas evita erros
        retornar_erro("Não foi possível gerar o nome da pasta para o Título ID {$id_titulo}.", $conn);
    }
    // DELETAR AS PÁGINAS ASSOCIADAS PRIMEIRO (CHAVE ESTRANGEIRA)
    $sql_delete_paginas = "DELETE FROM paginas WHERE id_edicao = ?";
    if ($stmt_paginas = $conn->prepare($sql_delete_paginas)) {
        $stmt_paginas->bind_param("i", $id_edicao);
        if (!$stmt_paginas->execute()) {
            throw new Exception("Erro ao deletar páginas: " . $stmt_paginas->error);
        }
        $stmt_paginas->close();
    } else {
        throw new Exception("Erro na preparação do SQL (páginas): " . $conn->error);
    }
    
    // DELETAR A EDIÇÃO
    $sql_delete_edicao = "DELETE FROM edicoes WHERE id = ?";
    if ($stmt_edicao = $conn->prepare($sql_delete_edicao)) {
        $stmt_edicao->bind_param("i", $id_edicao);

        if (!$stmt_edicao->execute()) {
            // Se a execução falhar, rollback
            throw new Exception("Erro ao deletar edição: " . $stmt_edicao->error);
        }
        // Se as páginas foram deletadas, a transação deve seguir em frente.
        $stmt_edicao->close();

    } else {
        throw new Exception("Erro na preparação do SQL (edição): " . $conn->error);
    }

    // SE TUDO CORREU BEM, CONFIRMA A TRANSAÇÃO
    $conn->commit();

    // DELETAR PASTA E CONTEÚDO NO SERVIDOR
    // Define o caminho base dos arquivos
    $DIR_BASE = $_SERVER['DOCUMENT_ROOT'] . '/hq_app/files/';

    // Monta o caminho completo da pasta da edição
    $pasta_edicao_completa = $DIR_BASE . $pasta_titulo . DIRECTORY_SEPARATOR . 'edicao_' . $numero_edicao;

    if (is_dir($pasta_edicao_completa)) {
        if (deleteDirectory($pasta_edicao_completa)) {
            // Sucesso
        } else {
            // Se a pasta não for deletada, retorne sucesso, mas adicione um aviso
            // para o log, pois o BD já foi atualizado
            error_log("AVISO: Falha ao deletar a pasta no disco: " . $pasta_edicao_completa);
        }
    }
    
    $response = [
        'status' => 'sucesso',
        'mensagem' => "A edição e seus dados associados foram excluídos com sucesso."
    ];

} catch (Exception $e) {
    // SE ALGO FALHOU, REVERTE TUDO
    $conn->rollback();
    retornar_erro("Falha na deleção: " . $e->getMessage(), $conn);
}

$conn->close();

echo json_encode($response);