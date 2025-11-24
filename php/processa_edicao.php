<?php
ob_start(); 

header('Content-Type: application/json');
ini_set('display_errors', 1);
error_reporting(E_ALL);
ini_set('html_errors', 0);
// Variável que guardará a resposta final. Inicializa com falha.
$final_response = [
    'status' => 'erro',
    'mensagem' => 'Ocorreu um erro desconhecido.'
];
// Funções para simplificar a saída de erro e sucesso
function retornar_erro($conn, $msg, $edicao_id = null, $pasta_destino = null) { // <-- Adicione $pasta_destino
    global $final_response;
    $final_response['mensagem'] = $msg;
    if (ob_get_length()) {
        ob_clean();
    }
    
    // Limpa a pasta se for fornecida
    if ($pasta_destino && is_dir($pasta_destino)) {
        require_once '../lib/upEdAux.php'; // Garante que a função esteja disponível
        remover_diretorio_recursivo($pasta_destino);
    }
    
    // Se houver ID da edição, limpa o registro que falhou na fase inicial
    if ($edicao_id) {
        $conn->query("DELETE FROM edicoes WHERE id = {$edicao_id}");
    }
    echo json_encode($final_response);
    exit();
}
function retornar_sucesso($titulo_id) {
    global $final_response;
    
    $final_response['status'] = 'sucesso';
    $final_response['mensagem'] = 'Edição processada com sucesso! Redirecionando para atualização.';
    if (ob_get_length()) {
        ob_clean(); 
    }
    // Retorna a URL que o JavaScript deve seguir
    $final_response['redirect_url'] = 'templateUpdate.html?id=' . $titulo_id . "&success=1"; 
    echo json_encode($final_response);
    exit();
}
//------------------------------------------------------------------------------
require_once '../config/config.php';
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME, DB_PORT);
if ($conn->connect_error) {
    retornar_erro($conn, "A conexão falhou. Verifique o MySQL: " . $conn->connect_error);
}
//------------------------------------------------------------------------------
// COLETAS E VALIDAÇÕES INICIAIS
$titulo = isset($_POST['id_titulo']) ? (int)$_POST['id_titulo'] : 0;
$edicao_numero = (int)$_POST['edition'];
$data_lancamento_mm_aaaa = $conn->real_escape_string($_POST['lancamentoDate']);

if ($titulo === 0) {
    retornar_erro($conn, "Erro: ID de Título não fornecido ou inválido.");
}
// ------------------------------------------------------------------------------
// VALIDAÇÃO DE DUPLICIDADE DO NÚMERO DA EDIÇÃO
$sql_check_duplicidade = "SELECT id FROM edicoes WHERE id_titulo = ? AND edicao = ?";
$stmt_check_duplicidade = $conn->prepare($sql_check_duplicidade);

if ($stmt_check_duplicidade) {
    $stmt_check_duplicidade->bind_param("ii", $titulo, $edicao_numero);
    $stmt_check_duplicidade->execute();
    $result_check = $stmt_check_duplicidade->get_result();

    if ($result_check->num_rows > 0) {
        // ENCONTROU UMA EDIÇÃO COM ESSE NÚMERO E TÍTULO -> PROIBIR INSERÇÃO
        $stmt_check_duplicidade->close();
        retornar_erro($conn, "A Edição de número **{$edicao_numero}** já existe para este título. Altere o número ou edite a edição existente.");
    }
    $stmt_check_duplicidade->close();
} else {
    // Se não puder preparar o statement, retorne erro
    retornar_erro($conn, "Erro ao preparar a instrução de verificação de duplicidade.");
}
//------------------------------------------------------------------------------
// VALIDAÇÃO E PREPARAÇÃO DO ARRAY DE ARQUIVOS

// Variável que guarda o array de FILES
$file_data = $_FILES['fileHQ'] ?? null;

// Verifica se algum arquivo válido foi enviado (count > 0, ignorando campos vazios)
$arquivos_enviados = (
    $file_data &&
    isset($file_data['name']) && 
    is_array($file_data['name']) && 
    count(array_filter($file_data['name'])) > 0
);

if(!$arquivos_enviados){    
    retornar_erro($conn, "Erro: Você deve selecionar o arquivo principal da HQ (CBZ, CBR, ou PDF) OU selecionar as páginas soltas.");
}

// Determina a extensão baseada no PRIMEIRO arquivo enviado no array
$nome_primeiro_arquivo = $file_data['name'][0];
$extensao = strtolower(pathinfo($nome_primeiro_arquivo, PATHINFO_EXTENSION));

// Conta quantos arquivos foram realmente enviados (útil para checagem de arquivo único)
$count_arquivos_enviados = count(array_filter($file_data['name'])); 

//------------------------------------------------------------------------------
// INCLUSÃO DE FUNÇÕES AUXILIARES 
require_once '../lib/upEdAux.php';

//------------------------------------------------------------------------------
// PREPARAÇÃO DE DADOS E VARIÁVEIS ANTES DO INSERT
// chama a função para obter o nome da pasta
$pasta_titulo = gerar_nome_pasta($conn, $titulo);

// Formatar data SQL (FUNÇÃO AUXILIAR)
$data_sql_edicao = formatar_data_sql($data_lancamento_mm_aaaa); 

// Gerar pasta título (FUNÇÃO AUXILIAR)
if (!$pasta_titulo) {
    retornar_erro($conn, "Erro: Não foi possível obter o nome do título para criar a pasta.");
}
//------------------------------------------------------------------------------
// INSERT INICIAL DA EDIÇÃO (PONTO DE NÃO RETORNO)
// Evitar duplicidade
$id_edicao = 0;

// Tenta encontrar edição existente
$sql_select = "SELECT id FROM edicoes WHERE id_titulo = ? AND edicao = ?";
$stmt_select = $conn->prepare($sql_select);

if ($stmt_select) {
    $stmt_select->bind_param("ii", $titulo, $edicao_numero);
    $stmt_select->execute();
    $result_select = $stmt_select->get_result();

    if ($result_select->num_rows > 0) {
        // se edição já existe(ZUMBI OU REAL) -> USE O ID EXISTENTE
        $row = $result_select->fetch_assoc();
        $id_edicao = $row['id'];
        
        // DELETAR as páginas antigas (caso tenha sido uma falha incompleta)
        // e preparar o registro para o novo upload.
        $conn->query("DELETE FROM paginas WHERE id_edicao = {$id_edicao}");
        
    } else {
        // EDIÇÃO NOVA -> FAZ O INSERT
        $sql_insert = "INSERT INTO edicoes (id_titulo, edicao, data_lancamento, paginas)
                       VALUES (?, ?, ?, 0)";
        $stmt_insert = $conn->prepare($sql_insert);
        
        if ($stmt_insert) {
            $stmt_insert->bind_param("iis", $titulo, $edicao_numero, $data_sql_edicao);
            if ($stmt_insert->execute()) {
                $id_edicao = $conn->insert_id;
            } else {
                retornar_erro($conn, "Erro ao inserir nova Edição: " . $stmt_insert->error);
            }
            $stmt_insert->close();
        } else {
            retornar_erro($conn, "Erro ao preparar a instrução INSERT.");
        }
    }
    $stmt_select->close();
} else {
    retornar_erro($conn, "Erro ao preparar a instrução SELECT inicial.");
}

if ($id_edicao === 0) {
    retornar_erro($conn, "Falha crítica: Não foi possível obter ou criar o ID da edição.");
}

//------------------------------------------------------------------------------
// CRIAÇÃO DE PASTAS NO DISCO (FUNÇÃO AUXILIAR)

$dir_base = realpath(__DIR__ . '/../files/') . DIRECTORY_SEPARATOR;
$diretorio_destino = cria_diretorio($dir_base, $pasta_titulo, $edicao_numero);

if (!$diretorio_destino) {
    // Se falhar, use o novo ID para limpar o registro DB recém-criado
    retornar_erro($conn, "Erro: Falha ao criar o diretório de destino no disco.", $id_edicao);
}
// -----------------------------------------------------------------------------
// Resultado Padrão de Falha (Se nenhuma condição for atendida)
$resultado = [
    'sucesso' => false,
    'sql' => '',
    'paginas' => 0,
    'erro' => "Formato de arquivo '{$extensao}' não suportado ou dados incompletos."
];
// -----------------------------------------------------------------------------
// IDENTIFICAÇÃO E CHAMADA DO PROCESSADOR
$arquivos_aceitos_unico = ['cbz', 'zip', 'cbr', 'rar', 'pdf'];

if (in_array($extensao, $arquivos_aceitos_unico)) {
    
    // Checagem de segurança para garantir que apenas UM arquivo foi enviado
    if ($count_arquivos_enviados > 1) {
         $resultado['erro'] = "Erro: Para formatos CBZ/CBR/PDF, só pode enviar UM arquivo por vez. Foram enviados {$count_arquivos_enviados} arquivos.";
         
    } elseif ($extensao == 'cbz' || $extensao == 'zip'){
        require_once '../lib/upCbz.php';
        // Passa o array completo, o especialista pega o item [0]
        $resultado = processar_cbz($conn, $id_edicao, $edicao_numero, $file_data, $diretorio_destino, $pasta_titulo);
        
    } elseif ($extensao == 'cbr' || $extensao == 'rar'){
        require_once '../lib/upCbr.php';
        $resultado = processar_cbr($conn, $id_edicao, $edicao_numero, $file_data, $diretorio_destino, $pasta_titulo);
        
    } elseif ($extensao == 'pdf'){
        require_once '../lib/upPdf.php';
        $resultado = processar_pdf($conn, $id_edicao, $edicao_numero, $file_data, $diretorio_destino, $pasta_titulo);
    }
    
} elseif(in_array($extensao, ['jpg', 'jpeg', 'png'])){
    // Se for imagem, será tratado como MÚLTIPLAS IMAGENS SOLTAS (o array de $file_data)
    require_once '../lib/upImage.php'; 
    // Passa o array completo, que pode ter 1 ou N imagens.
    $resultado = processar_image($conn, $id_edicao, $edicao_numero, $file_data, $diretorio_destino, $pasta_titulo); 

}
// -----------------------------------------------------------------------------
// BLOCO ÚNICO DE TRATAMENTO DE ERRO E LIMPEZA
if (!$resultado['sucesso'] || $resultado['paginas'] === 0) {
    // Exibe o erro do especialista
    $mensagem_erro = $resultado['erro'] ?: "Ocorreu uma falha desconhecida no processamento do arquivo.";
    
    // IMPORTANTE: Passe o ID da edição E o caminho da pasta para que o erro limpe o DB e o disco.
    retornar_erro($conn, "Erro ao processar o arquivo: " . $mensagem_erro, $id_edicao, $diretorio_destino);
}
// -----------------------------------------------------------------------------
// BLOCO DE SUCESSO E REDIRECIONAMENTO FINAL
$sql_paginas_batch = $resultado['sql'];
$paginas_processadas = $resultado['paginas'];

if ($conn->multi_query($sql_paginas_batch) === TRUE){
    // Essencial para permitir que o próximo query (o UPDATE) funcione
    do {
        if ($result = $conn->store_result()) {
            $result->free();
        }
    } while ($conn->more_results() && $conn->next_result());
    
    //--------------------------------------------------------------------------
    // Atualizar contagem de páginas
    $sql_update = "UPDATE edicoes SET paginas = {$paginas_processadas} WHERE id = {$id_edicao}";
    
    if ($conn->query($sql_update) === TRUE) {
        retornar_sucesso($titulo);
    } else {
        retornar_erro($conn, "ERRO DE ATUALIZAÇÃO FINAL (Contador): Falhou ao atualizar a contagem de páginas. Erro: " . $conn->error);
    }
} else {
    retornar_erro($conn, "Erro ao inserir Páginas no Banco de Dados: " . $conn->error);
}
//------------------------------------------------------------------------------
$conn->close();