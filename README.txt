=============================================================================
--------------------CONFIGURAÇÃO DO AMBIENTE E BANCO DE DADOS------------------
=============================================================================
1. Requisito de Execução:
	Para executar o projeto, é necessário ter o Docker e Docker Compose instalados no ambiente (Windows, Mac ou Linux).

2. Configuração do Banco de Dados (Totalmente Automatizada):
	O projeto utiliza Docker Compose para iniciar automaticamente o banco de dados MySQL/MariaDB.
	O arquivo `init.sql` (que contém a criação do banco de dados `hq_data` e o usuário padrão) é importado automaticamente na inicialização do serviço de banco de dados.
	NÃO é necessário instalar o XAMPP ou importar o arquivo SQL manualmente.

3. Credenciais de Conexão no Código (Pronto para Usar):
	O arquivo `config.php` já está configurado com as credenciais de serviço necessárias (`DB_SERVER`, `DB_USERNAME`, `DB_PASSWORD`) especificadas no `docker-compose.yml`.
	Ação Necessária: Nenhuma alteração manual é necessária neste arquivo. A conexão será estabelecida automaticamente assim que os contêineres do Docker estiverem rodando.

4. Comando de Inicialização:
	- Para iniciar o projeto, o avaliador deve apenas abrir o terminal na pasta raiz e executar o comando:
      	> `docker-compose up -d`

***

Método Alternativo (Execução via XAMPP/Local):
	É possível rodar o projeto em um ambiente XAMPP/MAMP/WAMP, mas requer passos manuais:
        	1.  Copie os arquivos para o diretório `htdocs` (ou similar).
       		2.  Adicione manualmente o banco de dados `hq_data`. O arquivo 'hq_data.sql' com a estrutura e os dados do banco está anexado à entrega e deve ser IMPORTADO antes da execução do sistema.
        	3.  Importe manualmente o arquivo `init.sql` para este banco.
        	4.  Se o XAMPP não estiver usando a porta e credenciais padrão, deverá editar o arquivo `config.php` com suas credenciais locais (`localhost`, porta, usuário, senha).

=============================================================================
----------------------INFORMAÇÕES ESPECIFICAS--------------------------------
=============================================================================
Extensões/Bibliotecas de Terceiros Necessárias (Instalação Obrigatória):

As seguintes extensões PHP e bibliotecas externas são obrigatórias para que o sistema de extração/conversão de arquivos funcione:

1.  Extensão `php_rar` (Para arquivos .cbr/.rar):
    - Função: Essencial para processar e extrair imagens de arquivos RAR compactados.
    - Instalação: Precisa ser baixada e instalada de fontes externas, pois não vem nativa no PHP. É crucial que a versão seja compatível com a versão do PHP e a arquitetura (x86/x64) do XAMPP do avaliador.
    - Referência: Recomenda-se pesquisar por "php rar extension [Versão do PHP]" (Ex: php rar extension 8.2) no Google para obter o arquivo correto.

2.  `imagick` e `ghostscript` (Para arquivos .pdf):
    - Função: Permite ao PHP ler, manipular e converter arquivos PDF em imagens.
    - Instalação do Ghostscript: Deve ser instalado como um software no sistema operacional.
    - Instalação do Imagick: Deve ser ativado como extensão do PHP (`php_imagick.dll`).
    - Referência: Instruções detalhadas para instalação (incluindo o caminho correto do `Ghostscript`) podem ser facilmente encontradas pesquisando "install imagick xampp [Versão do PHP]".

3. Arquivos `.zip` e `.cbz` (Sem Extensão Adicional):
    - Não é necessária nenhuma extensão externa (como `php_rar`) para processar arquivos `.zip` ou `.cbz`.
	O PHP possui uma extensão nativa (interna) chamada `ZipArchive` que já faz parte da instalação padrão. O sistema utiliza essa funcionalidade nativa para a extração de imagens de arquivos ZIP, garantindo maior compatibilidade e dispensando passos adicionais de configuração para este formato.

Formatos de Arquivos Suportados pelo sistema:
- Arquivos de Imagem: `.png`, `.jpg`, `.jpeg`
- Arquivos ZIP: `.cbz`, `.zip`
- Arquivos RAR: `.cbr`, `.rar`
- Documentos: `.pdf`

=============================================================================
-------------------------SOBRE O SISTEMA-------------------------------------
=============================================================================
Arquitetura de Usuário (Importante):
    - O sistema é projetado para uso por um único usuário administrador. Não há funcionalidades de cadastro ou login de múltiplos usuários.
    - Usuário Padrão Único: O sistema opera com um usuário padrão fixo (ID 1, ou similar) que não deve ser alterado ou deletado do banco de dados.
    - Justificativa: Essa arquitetura de usuário único foi adotada para simplificar a lógica de controle de acesso e evitar problemas de duplicação ou conflito de dados (como Favoritos e histórico de informações) que poderiam ocorrer em um ambiente multiusuário.


1- Enviar Título com informações:
	- Título Local
	- Título Original
	- Ano de lançamento
	- Gênero
	- Editora

2- Cada título possui página unica dedicada.

3- Adicionar nova edição com informações:
	- Numero da Edição
	- Data da Edição
	- Unico Seletor de Arquivo, na qual reconhece qual é o formato enviado para fazer a extração/conversão das imagens.

4- Leitor de páginas com funções:
	- Modo Vertical/ Modo Avançar página
	- Zoom +, -, 100%
	- Mostra número da página atual

5- Sistema de alterar informações:
	- EDIÇÕES: Mudar número da edição; mudar data de lançamento da edição.
	- TÍTULOS:

6- Sistema de Delete:
	- EDIÇÕES:
		- Pode ser deletado 1 por vez.
		- Ordem do script para delete: páginas -> edição -> apagar pastas e arquivos.

	- TÍTULOS:
		- Pode ser deletado 1 por vez.
		- Ordem do script de dados para delete: remover do favoritos -> todas as páginas de todas as edições -> todas as edições -> título -> apagar pastas e arquivos.

7- Visualização de Informações Gerais:
	- Mostra:
		- Títulos totais cadastrados
		- Títulos totais favoritados
		- Edições totais cadastrados

8- Pesquisa de Título com opções de filtro:
	- Nome Localizado
	- Nome Original
	- Data Lançamento do título
	- Editora
	- Gênero
	- Quantidade de páginas (0-30, 31-60, 61-99, 100+)
	- Se esta no favoritos
	- Possui edições cadastradas? (check sim/não)

9- Sistema de Favoritos
	- Qualquer Título enviado pode ser adicionado/removido dos Favoritos
	- Título marcados como favoritos aparece uma cópia de acesso em página dedicada.

10 - Filtro de Título Localizado por seção A-Z, 0-9. (todos os títulos)

11- Opção para 'MOSTRAR MAIS':
	- Edições: é mostrado por padrão 10 edições, podendo carregar mais 10 por vez.
	- Títulos enviados: é mostrado 20 por padrão, podendo carregar mais 20 por vez.
	- Pesquisa por filtro: é mostrado 40 por padrão, podendo carregar mais 40 por vez.

 12- Voltar para o topo da página rolagem suave:
	- Página index: clicar em início
	- Página Favoritos: clicar em Favoritos
	- Página Títulos Enviados: clicar em Títulos Enviados
	- Página Enviar Título: clicar em Enviar Título
	- Página título dedicado: clicar em imagem da Logo Crazy Views

13. Sistema de Dark Mode / Light Mode:
	- Funcionalidade: O usuário pode alternar entre o tema escuro (Dark Mode) e o tema claro (Light Mode) através de um botão com ícone de Sol/Lua, localizado no cabeçalho superior.
	- Persistência: O sistema salva a preferência do usuário (Dark/Light) no `localStorage` do navegador, garantindo que o modo seja mantido ao recarregar a página ou navegar entre as diferentes telas do sistema.

=============================================================================
-------------------------PERSONALIZAÇÃO--------------------------------------
=============================================================================
1- Capa dos Títulos:
	- Pega a primeira imagem da primeira edição encontrada na lista.

2- Capa das Edições:
	- Pega a primeira imagem encontrada na lista de páginas.

3- Banner da página de título dedicada:
	- Pega imagens aleatórias da primeira edição encontrada na lista, mostrando posições x, y aleatórias. Muda sempre que recarregar página(F5).

4- Paleta de Cores do sistema:
	- Azul: #256EFF
	- Laranja: #F56416
	- Roxo: #46237A
	- Amarelo: #F4D35E
	- Branco: #FCFCFC
	Alternância: O sistema utiliza variáveis CSS (`var(--...)`) para alternar as cores primárias/secundárias (Azul/Laranja) com cores neutras no modo escuro, garantindo uma transição suave entre os temas.

=============================================================================
----------------------------PÁGINAS------------------------------------------
=============================================================================
1- Index
2- Favoritos
3- Títulos enviados
4- Enviar Título
5- Página dedicada ao título, onde tem as edições (template único)
6- Leitor de HQ

Conteúdo da página Index:
1- Informações Gerais
2- Barra de pesquisa com opção  de filtro

Conteúdo da página Favoritos:
1- Lista de Títulos marcados como favorito
2- Cada Título que é mostrado na lista tem opções de desmarcar do favorito, editar informações de título, deletar e acessar página do título dedicada.

Conteúdo da página Títulos Enviados:
1- Ao abrir mostra todos os títulos enviados, mostrando os primeiros 20, podendo carregar mais 20 por vez. Rolagem infinita.
2- Filtro de títulos Localizados A-Z 0-9
3- Cada Título possui opção de marcar/desmarcar como favorito, editar informações de de título, deletar e acessar página do título dedicada.

Conteúdo da página Enviar Título
1- Formulário para preencher com informações essenciais do título:
	- Título Local
	- Título Original
	- Ano de Lançamento
	- Gênero
	- Editora

Conteúdo da página de Título Dedicada:
1- Banner interativo;
2- Capa de Título interativo;
3- Capa de edição interativa;
4- formulário para enviar nova edição com informações básicas especificas:
	- Numero da edição
	- Data que lançou a edição
	- Caixa para selecionar arquivo das páginas
5- Cada edição possui opções de editar informações da edição, deletar edição e link para leitor.

Conteúdo da página Leitor de hq:
- Mostra todas as páginas enviadas da edição cadastrada escolhida para ler
- Função modo vertical e modo páginas
- Modo páginas possui opção de avançar, recuar páginas, zoom +, zoom -, zoom 100%