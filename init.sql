-- Script de inicialização do banco de dados hq_data
-- Cria todas as tabelas necessárias para o sistema de HQs

USE hq_data;

-- Tabela de Editoras
CREATE TABLE IF NOT EXISTS editoras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    editora VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Gêneros
CREATE TABLE IF NOT EXISTS generos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    genero VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Títulos
CREATE TABLE IF NOT EXISTS titulos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    original VARCHAR(255),
    lancamento INT,
    id_editora INT,
    id_genero INT,
    FOREIGN KEY (id_editora) REFERENCES editoras(id) ON DELETE SET NULL,
    FOREIGN KEY (id_genero) REFERENCES generos(id) ON DELETE SET NULL,
    INDEX idx_titulo (titulo),
    INDEX idx_lancamento (lancamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Edições
CREATE TABLE IF NOT EXISTS edicoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_titulo INT NOT NULL,
    edicao INT NOT NULL,
    data_lancamento DATE,
    paginas INT DEFAULT 0,
    FOREIGN KEY (id_titulo) REFERENCES titulos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_titulo_edicao (id_titulo, edicao),
    INDEX idx_id_titulo (id_titulo),
    INDEX idx_edicao (edicao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Páginas
CREATE TABLE IF NOT EXISTS paginas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_edicao INT NOT NULL,
    pagina INT NOT NULL,
    arquivo VARCHAR(500) NOT NULL,
    FOREIGN KEY (id_edicao) REFERENCES edicoes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_edicao_pagina (id_edicao, pagina),
    INDEX idx_id_edicao (id_edicao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Favoritos
CREATE TABLE IF NOT EXISTS titulos_favoritos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_titulo INT NOT NULL,
    FOREIGN KEY (id_titulo) REFERENCES titulos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_usuario_titulo (id_usuario, id_titulo),
    INDEX idx_id_usuario (id_usuario),
    INDEX idx_id_titulo (id_titulo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

