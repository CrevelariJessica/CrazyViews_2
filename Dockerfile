FROM php:8.2-apache

# Instala ferramentas do sistema operacional necessárias para compactação e compilação
RUN apt-get update && apt-get install -y \
    zlib1g-dev \
    libzip-dev \
    unzip \
    git \
    && rm -rf /var/lib/apt/lists/*

# Baixa o instalador automático de extensões do PHP (Para as extensões comuns)
ADD https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/
RUN chmod +x /usr/local/bin/install-php-extensions

# 1. Instala primeiro as extensões padrão usando a ferramenta automática
RUN install-php-extensions zip mysqli pdo_mysql

# 2. Compilação manual do RAR (Garante 100% de compatibilidade com PHP 8.2 e evita erros de download)
RUN git clone https://github.com/cataphract/php-rar.git /usr/src/php/ext/rar \
    && docker-php-ext-install rar \
    && rm -rf /usr/src/php/ext/rar

# 3. Configurações do Apache (Modo Rewrite e Index do site)
RUN a2enmod rewrite \
    && echo "ServerName localhost" >> /etc/apache2/apache2.conf \
    && echo "DirectoryIndex principal.html index.php index.html" > /etc/apache2/conf-available/custom-index.conf \
    && a2enconf custom-index

# 4. Configurações do PHP (Aumentando limites para aguentar HQs pesadas)
RUN echo 'upload_max_filesize = 100M' >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo 'post_max_size = 100M' >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo 'max_execution_time = 300' >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo 'max_input_time = 300' >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo 'memory_limit = 256M' >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo 'max_file_uploads = 50' >> /usr/local/etc/php/conf.d/uploads.ini