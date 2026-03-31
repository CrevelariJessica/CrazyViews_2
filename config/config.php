<?php
// Configuração para desenvolvimento local com Docker
// Quando rodando dentro do container PHP, use 'mysql' como host
// Quando rodando localmente (fora do Docker), use 'localhost'
$is_docker = getenv('DOCKER_CONTAINER') === 'true' || file_exists('/.dockerenv');
define('DB_SERVER', $is_docker ? 'mysql' : 'localhost');
define('DB_USERNAME', 'root');
define('DB_PASSWORD', $is_docker ? 'root' : '');
define('DB_NAME', 'hq_data');
define('DB_PORT', $is_docker ? 3306 : 3307);