<?php
header('Content-Type: application/json; charset=utf-8');

$response = [
    'status' => 'erro',
    'mensagem' => 'Erro desconhecido.'
];

function retornar_erro($msg, $conn = null){
    global $response;
    $response['mensagem'] = $msg;
    if ($conn) $conn->close();
    echo json_encode($response);
    exit();
}
require_once __DIR__ . '/../lib/upEdAux.php';
//------------------------------------------------------------------------------
require_once '../config/config.php';
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME, DB_PORT);

if($conn->connect_error){
    retornar_erro("Falha na conexão com banco de dados: " . $conn->connect_error);
}
//------------------------------------------------------------------------------
// Recebimento e Validação dos Dados
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    retornar_erro("Método de requisição inválido.", $conn);
}

$id_edicao = isset($_POST['id']) ? (int)$_POST['id'] : 0;
$novo_numero_raw = isset($_POST['numero']) ? $_POST['numero'] : null;
$nova_data = isset($_POST['data']) ? $_POST['data'] : null;
//------------------------------------------------------------------------------
// Validação Básica
if ($id_edicao <= 0) {
    retornar_erro("ID da edição inválido ou não fornecido.", $conn);
}
//------------------------------------------------------------------------------
// BUSCAR DADOS ANTIGOS (EDICAO_ANTIGA, ID_TITULO)
$sql_fetch = "SELECT id_titulo, edicao FROM edicoes WHERE id = ?";
if ($stmt_fetch = $conn->prepare($sql_fetch)) {
    $stmt_fetch->bind_param("i", $id_edicao);
    $stmt_fetch->execute();
    $result_fetch = $stmt_fetch->get_result();

    if ($result_fetch->num_rows === 0) {
        retornar_erro("Edição com ID {$id_edicao} não encontrada.", $conn);
    }
    $dados_antigos = $result_fetch->fetch_assoc();
    $titulo_id = $dados_antigos['id_titulo'];
    $numero_antigo = $dados_antigos['edicao'];

    $stmt_fetch->close();
} else {
    retornar_erro("Erro ao preparar busca de dados antigos: " . $conn->error, $conn);
}
//------------------------------------------------------------------------------
$update_fields = [];
$bind_types = '';
$bind_values = [];
$mensagem_sucesso = "Edição atualizada com sucesso.";
//------------------------------------------------------------------------------
// Validação e Preparação do NOVO Número da Edição
if ($novo_numero_raw !== null) {
    $novo_numero = (int)preg_replace('/\D/', '', $novo_numero_raw); // Limpa e garante que é numérico
    
    if ($novo_numero <= 0 || $novo_numero > 59499) {
        retornar_erro("Número da Edição inválido (deve ser > 0 e < 59500).", $conn);
    }
    // --------------------------------------------------------------------------
    // LÓGICA DE RENOMEAÇÃO E VERIFICAÇÃO DE DUPLICIDADE (SE HOUVER MUDANÇA)
    if ($novo_numero !== $numero_antigo) {
        
        // VERIFICAÇÃO DE DUPLICIDADE (O NOVO NÚMERO JÁ É USADO?)
        $sql_check_dup = "SELECT id FROM edicoes WHERE id_titulo = ? AND edicao = ? AND id != ?";
        if ($stmt_dup = $conn->prepare($sql_check_dup)) {
            $stmt_dup->bind_param("iii", $titulo_id, $novo_numero, $id_edicao);
            $stmt_dup->execute();
            if ($stmt_dup->get_result()->num_rows > 0) {
                $stmt_dup->close();
                retornar_erro("O número de edição **{$novo_numero}** já está em uso por outra edição deste título.", $conn);
            }
            $stmt_dup->close();
        }
        //----------------------------------------------------------------------
        // TENTAR RENOMEAR PASTA NO DISCO
        // Com auxilio da função gerar_nome_pasta (upEdAux.php)
        $pasta_titulo = gerar_nome_pasta($conn, $titulo_id);
        if (!$pasta_titulo) {
            retornar_erro("Erro: Não foi possível obter o nome do título para renomear a pasta.", $conn);
        }

        $dir_base = realpath(__DIR__ . '/../files/') . DIRECTORY_SEPARATOR;
        $pasta_antiga = $dir_base . $pasta_titulo . DIRECTORY_SEPARATOR . "edicao_{$numero_antigo}";
        $pasta_nova = $dir_base . $pasta_titulo . DIRECTORY_SEPARATOR . "edicao_{$novo_numero}";
        //----------------------------------------------------------------------
        // Verificação de segurança: A pasta antiga existe?
        if (is_dir($pasta_antiga)) {
            if (!rename($pasta_antiga, $pasta_nova)) {
                // Se falhar a renomeação, retorne erro ANTES do UPDATE no BD
                retornar_erro("Falha ao renomear a pasta no disco (de edicao_{$numero_antigo} para edicao_{$novo_numero}). Verifique as permissões.", $conn);
            }
            //------------------------------------------------------------------
            //Atualizar caminho das páginas
            // Define os novos e antigos prefixos de caminho
            $prefixo_antigo = "edicao_{$numero_antigo}/";
            $prefixo_novo = "edicao_{$novo_numero}/";
            
            // Query de UPDATE: Substitui o prefixo de caminho de todas as páginas desta edição
            // NOTA: Assumindo que a coluna onde o caminho está salvo chama-se 'caminho_arquivo' 
            // e a tabela que armazena as páginas chama-se 'paginas'. AJUSTE SE NECESSÁRIO!
            $sql_update_caminhos = "
                UPDATE paginas 
                SET arquivo = REPLACE(arquivo, ?, ?) 
                WHERE id_edicao = ?
            ";
            if ($stmt_caminhos = $conn->prepare($sql_update_caminhos)) {
                $stmt_caminhos->bind_param("ssi", $prefixo_antigo, $prefixo_novo, $id_edicao);
                
                if ($stmt_caminhos->execute()) {
                    $mensagem_sucesso = "Edição e caminhos das páginas atualizados com sucesso.";
                } else {
                    $mensagem_sucesso = "Edição atualizada e pasta renomeada, mas falha ao atualizar caminhos no BD: " . $stmt_caminhos->error;
                }
                $stmt_caminhos->close();

            } else {
                 $mensagem_sucesso = "Edição atualizada e pasta renomeada, mas falha na preparação do SQL de caminhos: " . $conn->error;
            }
            //------------------------------------------------------------------
        }
    }
    $update_fields[] = "edicao = ?";
    $bind_types .= 'i'; // i para integer
    $bind_values[] = $novo_numero; // Usa o número limpo
}
//------------------------------------------------------------------------------
// Validação e Preparação da Data
if ($nova_data !== null) {
    // A data está vindo no formato AAAA-MM-DD (padrão de input text com máscara)
    // Validação de formato (simples)
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $nova_data)) {
        retornar_erro("Formato de data inválido. Use AAAA-MM-DD.", $conn);
    }
    
    $update_fields[] = "data_lancamento = ?";
    $bind_types .= 's'; // s para string
    $bind_values[] = $nova_data;
}
//------------------------------------------------------------------------------
// Se não houver campos para atualizar (o que não deve ocorrer com o modal)
if (empty($update_fields)) {
    retornar_erro("Nenhum dado de edição fornecido para atualização.", $conn);
}
//------------------------------------------------------------------------------
// Execução da Query de UPDATE (Com Prepared Statements)
$sql_update = "UPDATE edicoes SET " . implode(', ', $update_fields) . " WHERE id = ?";
//------------------------------------------------------------------------------
// Adiciona o ID ao final dos valores e 'i' ao final dos tipos
$bind_types .= 'i'; 
$bind_values[] = $id_edicao;

if ($stmt = $conn->prepare($sql_update)) {
    
    // Passa os tipos de binding e os valores como array (função call_user_func_array)
    $params = array_merge([$bind_types], $bind_values);
    $refs = [];
    foreach ($params as $key => $value) {
        $refs[$key] = &$params[$key];
    }

    call_user_func_array([$stmt, 'bind_param'], $refs);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            $response = [
                'status' => 'sucesso',
                'mensagem' => $mensagem_sucesso
            ];
        } else {
            $response = [
                'status' => 'sucesso', 
                'mensagem' => 'Nenhuma alteração detectada.'
            ];
        }
    } else {
        retornar_erro("Erro na execução do UPDATE: " . $stmt->error, $conn);
    }

    $stmt->close();

} else {
    retornar_erro("Erro na preparação do SQL: " . $conn->error, $conn);
}

$conn->close();
echo json_encode($response);