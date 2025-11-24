<?php
header('Content-Type: application/json');
// Oculta erros no output para o cliente (em produção)
ini_set('display_errors', 0);
// Habilita LOG de erros para que a função error_log seja gravada
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

require_once '../config/config.php';
require_once '../config/db_constants.php';

// -----------------------------------------------------------------------------
// FUNÇÕES DE UTILIDADE
// Função centralizada para retornar sucesso
function retornar_sucesso($mensagem, $extras = []) {
    $response = array_merge(['status' => 'sucesso', 'mensagem' => $mensagem], $extras);
    echo json_encode($response);
    exit();
}

// Função centralizada para retornar erro e fechar a conexão, se houver
function retornar_erro($mensagem, $conn = null) {
    $response = ['status' => 'erro', 'mensagem' => $mensagem];
    if ($conn) $conn->close();
    echo json_encode($response);
    exit();
}

/**
 * FUNÇÃO OBRIGATÓRIA PARA REMOÇÃO RECURSIVA DE DIRETÓRIOS E CONTEÚDO
 * O PHP (rmdir) só remove pastas vazias. Esta função apaga tudo dentro.
 * @param string $dir - O caminho completo da pasta a ser removida.
 * @return bool
 */
function removerDiretorioRecursivamente($dir) {
    if (!is_dir($dir)) {
        error_log("DEBUG: Pasta $dir não é um diretório ou não existe.");
        return false;
    }
    
    // Lista todos os arquivos e diretórios, exceto '.' e '..'
    $files = array_diff(scandir($dir), array('.', '..'));
    foreach ($files as $file) {
        $path = "$dir/$file";
        // Se for um diretório, chama a função recursivamente. Senão, apaga o arquivo.
        if (is_dir($path)) {
            error_log("DEBUG: Removendo subdiretório: $path");
            removerDiretorioRecursivamente($path);
        } else {
            error_log("DEBUG: Removendo arquivo: $path");
            if (!unlink($path)) {
                error_log("ERRO: Falha ao deletar arquivo: $path");
            }
        }
    }
    // Remove o diretório principal (que agora está vazio)
    $result = rmdir($dir);
    if ($result) {
        error_log("DEBUG: Diretório raiz removido com sucesso: $dir");
    } else {
        error_log("ERRO: Falha ao remover o diretório raiz: $dir");
    }
    return $result;
}

/**
 * REPLICA A LOGICA DE FORMATACAO DE up.EdAux.php::gerar_nome_pasta
 * Mas recebe o nome do título diretamente, sem precisar de ID.
 * É CRUCIAL que essa lógica seja a mesma usada na criação original.
 * @param string $titulo_nome - O nome do título local.
 * @return string O nome da pasta sanitizado.
 */
function formatar_nome_pasta_para_disco($titulo_nome) {
    // 1. Minúsculas (usando mb_strtolower para garantir suporte a acentos) e trim
    $pasta_titulo = trim($titulo_nome);
    if (function_exists('mb_strtolower')) {
        $pasta_titulo = mb_strtolower($pasta_titulo);
    } else {
        $pasta_titulo = strtolower($pasta_titulo);
    }
    
    // 2. Substitui espaços por '_'
    $pasta_titulo = str_replace(" ", "_", $pasta_titulo);
    
    // 3. Remove caracteres que não sejam alfanuméricos ou '_'
    // Corresponde a: preg_replace('/[^A-Za-z0-9\_]/', '', $pasta_titulo); de up.EdAux.php
    $pasta_titulo = preg_replace('/[^A-Za-z0-9\_]/', '', $pasta_titulo);
    
    // 4. Limita o tamanho (substr($pasta_titulo, 0, 100))
    $pasta_titulo = substr($pasta_titulo, 0, 100);
    
    // 5. Fallback (usando um time() seguro se o título for invalidado)
    if (empty($pasta_titulo)) {
        $pasta_titulo = "titulo_generico_" . time();
    }
    
    return $pasta_titulo;
}


// -----------------------------------------------------------------------------
// CONEXÃO E PREPARAÇÃO
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME, DB_PORT);
if ($conn->connect_error) {
    retornar_erro('Falha na conexão com o banco de dados: ' . $conn->connect_error);
}

// Garante que a requisição seja POST e que o conteúdo seja JSON
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    retornar_erro('Método de requisição inválido.', $conn);
}

// Decodifica o JSON enviado pelo JavaScript
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['action'])) {
    retornar_erro('Parâmetro de ação ausente.', $conn);
}

$action = $data['action'];
// Pega o ID do título, mas verifica se ele existe nos casos que necessitam
$id_titulo = isset($data['id_titulo']) ? (int)$data['id_titulo'] : null;
$id_usuario = ID_USUARIO_PADRAO; // Assume que o ID_USUARIO_PADRAO está definido

// -----------------------------------------------------------------------------
// LÓGICA DE AÇÃO CENTRALIZADA (Switch)

switch ($action) {
    
    // =========================================================================
    // NOVO CASE: BUSCAR DADOS DO TÍTULO PARA EDIÇÃO
    case 'get_titulo_data':
        if ($id_titulo === null || $id_titulo <= 0) {
            retornar_erro('ID do título inválido para busca.', $conn);
        }

        $sql_fetch = "SELECT t.id, t.titulo, t.original, t.lancamento, 
                             e.id AS id_editora, e.editora, 
                             g.id AS id_genero, g.genero
                      FROM titulos t
                      JOIN editoras e ON t.id_editora = e.id
                      JOIN generos g ON t.id_genero = g.id
                      WHERE t.id = $id_titulo";
        
        $result_fetch = $conn->query($sql_fetch);

        if ($result_fetch && $result_fetch->num_rows > 0) {
            $data = $result_fetch->fetch_assoc();
            // Adiciona a data de lançamento no formato MM/AAAA para preencher o campo do formulário
            // O campo 'lancamento' na tabela Titulos é o ANO (int). O front-end precisará lidar com isso, 
            // já que a API de Edição lida com MM/AAAA. Para a Edição do Título, 
            // basta retornar o ano (int) para preencher o campo de ano.
            retornar_sucesso('Dados do título recuperados com sucesso.', ['titulo_data' => $data]);
        } else {
            retornar_erro('Título não encontrado.', $conn);
        }
        break;
        
    // =========================================================================
    // CASE: TOGGLE FAVORITO
    case 'toggle_favorito':
        if ($id_titulo === null || $id_titulo <= 0) {
            retornar_erro('ID do título inválido para Favorito.', $conn);
        }
        
        $safe_id_titulo = $conn->real_escape_string($id_titulo);

        // Verifica se o título já é um favorito
        $check_sql = "SELECT id FROM titulos_favoritos WHERE id_usuario = $id_usuario AND id_titulo = $safe_id_titulo LIMIT 1";
        $result = $conn->query($check_sql);

        if ($result->num_rows > 0) {
            // DELETAR
            $toggle_sql = "DELETE FROM titulos_favoritos WHERE id_usuario = $id_usuario AND id_titulo = $safe_id_titulo";
            $mensagem_sucesso = 'Título removido dos favoritos.';
            $operacao = 'deleted';
        } else {
            // INSERIR
            $toggle_sql = "INSERT INTO titulos_favoritos (id_usuario, id_titulo) VALUES ($id_usuario, $safe_id_titulo)";
            $mensagem_sucesso = 'Título adicionado aos favoritos.';
            $operacao = 'inserted';
        }

        if ($conn->query($toggle_sql) === TRUE) {
            retornar_sucesso($mensagem_sucesso, ['operacao' => 'inserted']);
        } else {
            retornar_erro('Erro ao realizar operação no banco de dados: ' . $conn->error, $conn);
        }
        break;

    // =========================================================================
    // CASE: DELETAR TÍTULO (Com remoção de arquivos)
    case 'delete_titulo':
        if ($id_titulo === null || $id_titulo <= 0) {
            retornar_erro('ID do título inválido para Exclusão.', $conn);
        }

        // ---------------------------------------------------------------------
        // PASSO 0: BUSCAR O CAMINHO DA PASTA RAIZ (DO TÍTULO)
        $sql_path = "SELECT p.arquivo FROM paginas p JOIN edicoes e ON p.id_edicao = e.id WHERE e.id_titulo = $id_titulo LIMIT 1";
        $result_path = $conn->query($sql_path);
        $primeira_pagina_data = $result_path->fetch_assoc();
        $caminho_completo_arquivo = $primeira_pagina_data['arquivo'] ?? null;
        
        $nome_pasta_titulo = null;
        
        if ($caminho_completo_arquivo) {
            $caminho_limpo = trim($caminho_completo_arquivo, '/');
            $path_segments = explode('/', $caminho_limpo);
            
            // O nome da pasta do título é o SEGUNDO segmento (índice 1), pois o primeiro é "files".
            if (count($path_segments) > 1) {
                $nome_pasta_titulo = $path_segments[1];
            }
            
            error_log("DEBUG: Caminho de arquivo da DB: " . $caminho_completo_arquivo);
            error_log("DEBUG: Nome da pasta do Título extraído (corrigido): " . $nome_pasta_titulo);
            
            if (empty($nome_pasta_titulo) || $nome_pasta_titulo === '..') {
                $nome_pasta_titulo = null; // Segurança
            }
        } else {
            error_log("DEBUG: Nenhuma página encontrada para o título $id_titulo. Nenhuma pasta será deletada.");
        }
        
        $pasta_removida_com_sucesso = true; // Flag para a remoção dos arquivos

        try {
            $conn->begin_transaction();

            // 1. Remover dos Favoritos (titulos_favoritos)
            $sql_fav = "DELETE FROM titulos_favoritos WHERE id_titulo = $id_titulo";
            $conn->query($sql_fav);

            // 2. Deletar Páginas de todas as Edições (paginas)
            $sql_edicoes_ids = "SELECT id FROM edicoes WHERE id_titulo = $id_titulo";
            $result_edicoes_ids = $conn->query($sql_edicoes_ids);
            $edicoes_ids = [];
            while ($row = $result_edicoes_ids->fetch_assoc()) {
                $edicoes_ids[] = $row['id'];
            }

            if (!empty($edicoes_ids)) {
                $edicoes_ids_str = implode(',', $edicoes_ids);
                $sql_paginas = "DELETE FROM paginas WHERE id_edicao IN ($edicoes_ids_str)";
                $conn->query($sql_paginas);
            }

            // 3. Deletar Edições (edicoes)
            $sql_edicoes = "DELETE FROM edicoes WHERE id_titulo = $id_titulo";
            $conn->query($sql_edicoes);

            // 4. Deletar o Título (titulos)
            $sql_titulo = "DELETE FROM titulos WHERE id = $id_titulo";
            if (!$conn->query($sql_titulo)) {
                throw new Exception("Falha ao deletar título: " . $conn->error);
            }

            $conn->commit(); // A exclusão do DB foi um sucesso!
            
            // ---------------------------------------------------------------------
            // PASSO 5: APAGAR PASTAS E ARQUIVOS (Sistema de Arquivos)
            
            if ($nome_pasta_titulo) {
                // Monta o caminho absoluto. 
                $caminho_base_files = dirname(__DIR__) . '/files/'; 
                $caminho_completo_pasta = $caminho_base_files . $nome_pasta_titulo;

                error_log("DEBUG: Caminho completo da pasta a ser deletada: " . $caminho_completo_pasta);

                if (is_dir($caminho_completo_pasta)) {
                    error_log("DEBUG: Pasta encontrada no disco. Iniciando exclusão recursiva...");
                    $pasta_removida_com_sucesso = removerDiretorioRecursivamente($caminho_completo_pasta);
                } else {
                    error_log("DEBUG: A pasta [$caminho_completo_pasta] não foi encontrada no disco.");
                    $pasta_removida_com_sucesso = false; 
                }
            } else {
                $pasta_removida_com_sucesso = true;
            }

            // Mensagem de sucesso baseada na exclusão do arquivo
            $msg = $pasta_removida_com_sucesso 
                ? "Título, edições, páginas, favoritos e pasta de arquivos deletados com sucesso!"
                : "Título e DB deletados com sucesso. ATENÇÃO: Falha ao remover a pasta de arquivos no servidor. Verifique as permissões ou se a pasta realmente existia.";
            
            retornar_sucesso($msg, ['operacao' => 'deleted']);

        } catch (Exception $e) {
            $conn->rollback();
            retornar_erro('Falha crítica na exclusão do título: ' . $e->getMessage(), $conn);
        }
        break;

    // =========================================================================
    // NOVO CASE: ATUALIZAR INFORMAÇÕES DO TÍTULO (E RENOMEAR PASTA, se necessário)
    case 'update_titulo':
        if ($id_titulo === null || $id_titulo <= 0) {
            retornar_erro('ID do título inválido para atualização.', $conn);
        }

        // Validação e sanitização dos dados
        $novo_titulo_local = $data['titulo'] ?? null;
        $original = $data['original'] ?? null;
        $lancamento = isset($data['lancamento']) ? (int)$data['lancamento'] : null;
        $editora_nome = $data['editora'] ?? null;
        $genero_nome = $data['genero'] ?? null;

        if (empty($novo_titulo_local) || empty($editora_nome) || empty($genero_nome)) {
            retornar_erro('Dados de atualização incompletos ou inválidos (Título, Editora ou Gênero).', $conn);
        }

        // Sanitização
        $safe_titulo_local = $conn->real_escape_string($novo_titulo_local);
        $safe_original = $conn->real_escape_string($original);
        $safe_lancamento = $lancamento ? (int)$lancamento : 'NULL';
        
        // --- NOVIDADE: GARANTE EDITORAS/GÊNEROS EXISTEM ANTES DE ATUALIZAR ---
        // Funções reutilizadas (adaptadas) para garantir IDs
        $id_genero = get_or_create_id($conn, 'generos', 'genero', $genero_nome);
        $id_editora = get_or_create_id($conn, 'editoras', 'editora', $editora_nome);
        
        if ($id_genero === null || $id_editora === null) {
             retornar_erro('Falha ao obter/criar ID de Gênero ou Editora.', $conn);
        }
        
        $safe_id_editora = (int)$id_editora;
        $safe_id_genero = (int)$id_genero;
        // ---------------------------------------------------------------------
        
        // GERA O NOVO NOME DA PASTA USANDO A FUNÇÃO CONSISTENTE
        $novo_nome_pasta = formatar_nome_pasta_para_disco($novo_titulo_local);

        $old_nome_pasta = null;
        $caminho_base_files = dirname(__DIR__) . '/files/'; 
        $pasta_renomeada_com_sucesso = true;
        
        try {
            $conn->begin_transaction();

            // 1. OBTEM O TÍTULO ATUAL E O NOME DA PASTA ANTIGA (SE HOUVER PÁGINAS)
            $sql_current = "SELECT t.titulo, p.arquivo 
                            FROM titulos t
                            LEFT JOIN edicoes e ON t.id = e.id_titulo
                            LEFT JOIN paginas p ON e.id = p.id_edicao
                            WHERE t.id = $id_titulo LIMIT 1";
            
            $result_current = $conn->query($sql_current);
            $current_data = $result_current->fetch_assoc();
            
            $titulo_antigo = $current_data['titulo'] ?? '';
            $caminho_arquivo_antigo = $current_data['arquivo'] ?? null;
            
            if ($caminho_arquivo_antigo) {
                $caminho_limpo = trim($caminho_arquivo_antigo, '/');
                $path_segments = explode('/', $caminho_limpo);
                if (count($path_segments) > 1) {
                    // O nome da pasta é o segundo segmento (índice 1)
                    $old_nome_pasta = $path_segments[1];
                }
            }
            
            error_log("DEBUG UPDATE: Título antigo: " . $titulo_antigo . ", Pasta Antiga Extraída: " . $old_nome_pasta);
            error_log("DEBUG UPDATE: Novo Nome Pasta (Formatado): " . $novo_nome_pasta);

            // 2. ATUALIZA OS DADOS NA TABELA TITULOS
            $sql_update_titulo = "UPDATE titulos SET 
                                titulo = '$safe_titulo_local',
                                original = " . (!empty($safe_original) ? "'$safe_original'" : 'NULL') . ",
                                lancamento = $safe_lancamento,
                                id_editora = $safe_id_editora,
                                id_genero = $safe_id_genero
                                WHERE id = $id_titulo";

            if (!$conn->query($sql_update_titulo)) {
                throw new Exception("Falha ao atualizar título no DB: " . $conn->error);
            }
            
            // 3. RENOMEAR PASTA E ATUALIZAR CAMINHOS SE O TÍTULO LOCAL MUDOU E EXISTE PASTA
            if ($old_nome_pasta && $novo_nome_pasta !== $old_nome_pasta) {
                $caminho_antigo = $caminho_base_files . $old_nome_pasta;
                $caminho_novo = $caminho_base_files . $novo_nome_pasta;

                error_log("DEBUG UPDATE: Tentando renomear de: $caminho_antigo para: $caminho_novo");

                if (!is_dir($caminho_antigo)) {
                    error_log("ERRO UPDATE: Pasta antiga [$caminho_antigo] não encontrada. Atualização de caminho DB pulada.");
                    $pasta_renomeada_com_sucesso = false;
                } else if (!rename($caminho_antigo, $caminho_novo)) {
                    throw new Exception("Falha ao renomear a pasta de $old_nome_pasta para $novo_nome_pasta. Verifique as permissões do PHP.");
                } else {
                    error_log("DEBUG UPDATE: Pasta renomeada com sucesso.");

                    // Atualiza TODOS os caminhos na tabela 'paginas' (Substitui o nome da pasta antiga pelo novo)
                    // Buscamos todas as edições para este título
                    $sql_edicoes_ids = "SELECT id FROM edicoes WHERE id_titulo = $id_titulo";
                    $result_edicoes_ids = $conn->query($sql_edicoes_ids);
                    $edicoes_ids = [];
                    while ($row = $result_edicoes_ids->fetch_assoc()) {
                        $edicoes_ids[] = $row['id'];
                    }

                    if (!empty($edicoes_ids)) {
                        $edicoes_ids_str = implode(',', $edicoes_ids);
                        
                        // Exemplo: 'files/Hulk...' -> 'files/hulk_novo...'
                        $antigo_prefixo = "files/$old_nome_pasta/";
                        $novo_prefixo = "files/$novo_nome_pasta/";
                        
                        $sql_update_caminhos = "UPDATE paginas 
                                                SET arquivo = REPLACE(arquivo, '$antigo_prefixo', '$novo_prefixo')
                                                WHERE id_edicao IN ($edicoes_ids_str)
                                                AND arquivo LIKE '$antigo_prefixo%'";
                                                
                        if (!$conn->query($sql_update_caminhos)) {
                            throw new Exception("Falha ao atualizar caminhos no DB: " . $conn->error);
                        }
                        error_log("DEBUG UPDATE: " . $conn->affected_rows . " caminhos na tabela 'paginas' atualizados com sucesso.");
                    }
                }
            }

            $conn->commit();
            
            $msg = $pasta_renomeada_com_sucesso 
                ? "Título atualizado com sucesso (incluindo renomeação de pasta)."
                : "Título atualizado com sucesso. ATENÇÃO: Falha na renomeação/localização da pasta.";

            retornar_sucesso($msg, ['operacao' => 'updated']);

        } catch (Exception $e) {
            $conn->rollback();
            retornar_erro('Falha crítica na atualização do título: ' . $e->getMessage(), $conn);
        }
        break;
        
    // =========================================================================
    // CASE: AÇÃO DESCONHECIDA
    default:
        retornar_erro("Ação '$action' não reconhecida.", $conn);
        break;
}

// FECHAR CONEXÃO E FUNÇÃO AUXILIAR DE get_or_create_id
$conn->close();

/**
 * Função auxiliar do processa_hq para buscar/inserir e retornar o ID (para Editora e Gênero)
 * Adaptada para esta API.
 * @param mysqli $conn - Conexão com o banco de dados.
 * @param string $table - Nome da tabela (generos ou editoras).
 * @param string $column_name - Nome da coluna de valor (genero ou editora).
 * @param string $value - O valor a ser inserido/buscado.
 * @return int|null - O ID do registro ou null em caso de falha.
 */
function get_or_create_id($conn, $table, $column_name, $value) {
    $safe_value = $conn->real_escape_string($value);
    
    // Tenta inserir (IGNORE evita erro se já existir)
    $sql_insert = "INSERT IGNORE INTO $table ($column_name) VALUES ('$safe_value')";
    $conn->query($sql_insert);
    
    // Busca o ID (se foi inserido agora ou já existia)
    $result = $conn->query("SELECT id FROM $table WHERE $column_name = '$safe_value'");
    
    if ($result && $row = $result->fetch_assoc()) {
        return $row['id'];
    }
    return null;
}